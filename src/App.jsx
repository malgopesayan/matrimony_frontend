
import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useCallback
} from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useNavigate,
  useParams
} from 'react-router-dom';

// ==========================================
// API CONFIGURATION
// ==========================================

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

let toast = () => {};

// ==========================================
// API HELPER FUNCTION
// ==========================================

export async function api(p, { method = 'GET', body, form } = {}) {
  try {
    const headers = {};

    // Authentication token
    const token = localStorage.getItem('t');

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // JSON content type
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    // Backend API URL
    const url = `${API_BASE}/api${p}`;

    console.log('API Request:', url);

    // Send API request
    const response = await fetch(url, {
      method,
      headers,
      body: form || (body ? JSON.stringify(body) : undefined)
    });

    // Parse response
    const data = await response.json().catch(() => ({}));

    // Handle errors
    if (!response.ok) {
      const message =
        typeof data.detail === 'string'
          ? data.detail
          : data.message || `Request failed (${response.status})`;

      toast(message);

      throw new Error(message);
    }

    return data;

  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ==========================================
// AUTH CONTEXT
// ==========================================

const Auth = createContext();

const useAuth = () => useContext(Auth);

const RELIGIONS = [
  'Hindu',
  'Muslim',
  'Sikh',
  'Christian',
  'Jain',
  'Buddhist',
  'Other'
];

// ==========================================
// AVATAR
// ==========================================

const Av = ({ u, s = 64 }) =>
  u.photo ? (
    <img
      className="av"
      style={{ width: s, height: s }}
      src={u.photo}
    />
  ) : (
    <div
      className="av"
      style={{ width: s, height: s, fontSize: s / 2.4 }}
    >
      {u.name[0]}
    </div>
  );

// ==========================================
// PROFILE CARD
// ==========================================

function Card({ u, reload }) {
  const send = async () => {
    const r = await api('/interests', {
      method: 'POST',
      body: { to_id: u.id }
    });

    toast(
      r.status === 'accepted'
        ? "It's a match! 🎉"
        : 'Interest sent 💌'
    );

    reload && reload();
  };

  return (
    <div className="card pc">
      <Link to={'/u/' + u.id}>
        <Av u={u} s={92} />
        <h3>{u.name}, {u.age}</h3>
      </Link>

      <p>
        {[u.profession, u.city].filter(Boolean).join(' • ')}
      </p>

      <p>
        {[u.religion, u.community].filter(Boolean).join(', ')}
      </p>

      {u.score != null && (
        <div className="score">{u.score}% match</div>
      )}

      <div style={{ marginTop: 10 }}>
        {u.interest ? (
          <span className="pill">
            {u.interest === 'received'
              ? 'Wants to connect'
              : u.interest}
          </span>
        ) : (
          <button className="sm" onClick={send}>
            ♥ Send Interest
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// NAVIGATION
// ==========================================

function Nav() {
  const { user, logout } = useAuth();

  const L = (to, t) => (
    <NavLink className="l" to={to}>
      {t}
    </NavLink>
  );

  return (
    <nav>
      <Link to="/" className="logo">
        💍 MatrimonyConnect
      </Link>

      {user ? (
        <>
          {user.role === 'admin' ? (
            L('/admin', 'Admin Panel')
          ) : (
            <>
              {L('/matches', 'Matches')}
              {L('/search', 'Search')}
              {L('/interests', 'Interests')}
              {L('/chat', 'Chat')}
              {L('/profile', 'My Profile')}
            </>
          )}

          <button
            className="ghost sm"
            onClick={logout}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          {L('/login', 'Login')}

          <Link to="/register">
            <button className="sm">Join Free</button>
          </Link>
        </>
      )}
    </nav>
  );
}

// ==========================================
// LANDING PAGE
// ==========================================

function Landing() {
  const { user } = useAuth();

  return (
    <>
      <div className="hero">
        <div>
          <h1>Find the one you'll call home</h1>

          <p>
            Verified profiles, thoughtful matches and safe
            conversations — one account per person.
          </p>

          <Link to={user ? '/matches' : '/register'}>
            <button>Create Your Profile</button>
          </Link>

          <Link to="/login">
            <button className="ghost">Sign in</button>
          </Link>
        </div>
      </div>

      <div className="wrap">
        <div className="feat">
          {[
            [
              '🛡️',
              'Verified & Safe',
              'Face-based duplicate detection keeps profiles genuine.'
            ],
            [
              '🎯',
              'Smart Matches',
              'Weighted compatibility from your partner preferences.'
            ],
            [
              '💬',
              'Private Chat',
              'Chat opens only after both sides accept.'
            ]
          ].map(f => (
            <div className="card" key={f[1]}>
              <div style={{ fontSize: 34 }}>{f[0]}</div>
              <h3>{f[1]}</h3>
              <p style={{ color: 'var(--mut)' }}>{f[2]}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ==========================================
// LOGIN
// ==========================================

function Login() {
  const { load } = useAuth();
  const nav = useNavigate();

  const [f, setF] = useState({
    login: '',
    password: ''
  });

  const go = async e => {
    e.preventDefault();

    const r = await api('/login', {
      method: 'POST',
      body: f
    });

    localStorage.setItem('t', r.token);

    await load();

    const m = await api('/me');

    nav(m.role === 'admin' ? '/admin' : '/matches');
  };

  return (
    <form className="card form" onSubmit={go}>
      <h2>Welcome back</h2>

      <div className="f">
        <label>Email or phone</label>

        <input
          required
          autoComplete="username"
          value={f.login}
          onChange={e =>
            setF({ ...f, login: e.target.value })
          }
        />
      </div>

      <div className="f">
        <label>Password</label>

        <input
          type="password"
          required
          autoComplete="current-password"
          value={f.password}
          onChange={e =>
            setF({ ...f, password: e.target.value })
          }
        />
      </div>

      <button style={{ width: '100%' }}>
        Login
      </button>

      <p style={{ fontSize: 12, color: 'var(--mut)' }}>
        Demo: priya@demo.com / demo123 ·
        Admin: admin@matri.local / admin123
      </p>
    </form>
  );
}

// ==========================================
// CAMERA
// ==========================================

function Camera({ onCapture }) {
  const v = useRef();

  const [stream, setStream] = useState(null);
  const [shot, setShot] = useState(null);
  const [err, setErr] = useState('');

  const start = async () => {
    setShot(null);
    onCapture(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('no-api');
      }

      const st = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      setStream(st);

    } catch (e) {
      setErr(
        window.isSecureContext
          ? 'Camera permission denied or unavailable.'
          : 'Camera needs HTTPS. Open the https:// address shown by npm run dev.'
      );
    }
  };

  useEffect(() => {
    if (stream && v.current) {
      v.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [stream]);

  const snap = () => {
    const el = v.current;
    const c = document.createElement('canvas');

    c.width = el.videoWidth;
    c.height = el.videoHeight;

    c.getContext('2d').drawImage(el, 0, 0);

    c.toBlob(b => {
      if (!b) return;

      onCapture(new File([b], 'face.jpg', {
        type: 'image/jpeg'
      }));

      setShot(URL.createObjectURL(b));

      stream.getTracks().forEach(t => t.stop());
      setStream(null);

    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="f">
      <label>
        Live selfie for duplicate-account check (not stored)
      </label>

      <div className="cam">
        {shot ? (
          <img src={shot} />
        ) : stream ? (
          <video ref={v} autoPlay playsInline muted />
        ) : (
          <div className="camph">
            📷
            <br />
            Camera is off
          </div>
        )}
      </div>

      {err && (
        <p style={{ color: '#b91c1c', fontSize: 13 }}>
          {err}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {stream ? (
          <button type="button" onClick={snap}>
            ● Capture
          </button>
        ) : (
          <button
            type="button"
            className={shot ? 'ghost' : ''}
            onClick={start}
          >
            {shot ? 'Retake' : 'Open Camera'}
          </button>
        )}
      </div>

      {err && (
        <label style={{ display: 'block', marginTop: 8 }}>
          Or use phone camera app

          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={e => {
              const f = e.target.files[0];

              if (f) {
                onCapture(f);
                setShot(URL.createObjectURL(f));
              }
            }}
          />
        </label>
      )}
    </div>
  );
}

// ==========================================
// REGISTER
// ==========================================

function Register() {
  const { load } = useAuth();
  const nav = useNavigate();

  const [f, setF] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    gender: 'F',
    dob: ''
  });

  const [file, setFile] = useState(null);
  const [otp, setOtp] = useState(null);
  const [code, setCode] = useState('');

  const s = k => e =>
    setF({ ...f, [k]: e.target.value });

  const go = async e => {
    e.preventDefault();

    if (!file) {
      return toast('Please capture your live selfie first');
    }

    const fd = new FormData();

    Object.entries(f).forEach(([k, v]) => fd.append(k, v));

    fd.append('face_photo', file);

    const r = await api('/register', {
      method: 'POST',
      form: fd
    });

    setOtp(r.dev_otp);
    setCode(r.dev_otp);
  };

  const verify = async e => {
    e.preventDefault();

    const r = await api('/verify-otp', {
      method: 'POST',
      body: {
        phone: f.phone,
        otp: code
      }
    });

    localStorage.setItem('t', r.token);

    await load();

    nav('/profile');
  };

  if (otp) {
    return (
      <form className="card form" onSubmit={verify}>
        <h2>Verify your phone</h2>

        <p>
          Mock SMS for local testing — your OTP is
          <b> {otp} </b>
          (prefilled).
        </p>

        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          maxLength={6}
        />

        <br />
        <br />

        <button style={{ width: '100%' }}>
          Verify & Continue
        </button>
      </form>
    );
  }

  return (
    <form className="card form" onSubmit={go}>
      <h2>Create your account</h2>

      <div className="f">
        <label>Full name</label>

        <input
          required
          value={f.name}
          onChange={s('name')}
        />
      </div>

      <div className="row">
        <div className="f">
          <label>I am</label>

          <select value={f.gender} onChange={s('gender')}>
            <option value="F">Bride (Female)</option>
            <option value="M">Groom (Male)</option>
          </select>
        </div>

        <div className="f">
          <label>Date of birth</label>

          <input
            type="date"
            required
            value={f.dob}
            onChange={s('dob')}
          />
        </div>
      </div>

      <div className="row">
        <div className="f">
          <label>Email</label>

          <input
            type="email"
            required
            value={f.email}
            onChange={s('email')}
          />
        </div>

        <div className="f">
          <label>Mobile</label>

          <input
            required
            pattern="[0-9]{10}"
            title="10 digits"
            value={f.phone}
            onChange={s('phone')}
          />
        </div>
      </div>

      <div className="f">
        <label>Password (min 6)</label>

        <input
          type="password"
          required
          minLength={6}
          value={f.password}
          onChange={s('password')}
        />
      </div>

      <Camera onCapture={setFile} />

      <button style={{ width: '100%' }}>
        Register
      </button>
    </form>
  );
}

// ==========================================
// MATCHES
// ==========================================

function Matches() {
  const [l, setL] = useState(null);

  const load = useCallback(
    () => api('/matches').then(setL).catch(() => setL([])),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="wrap">
      <h2>Recommended for you</h2>

      <p style={{ color: 'var(--mut)' }}>
        Ranked by your partner preferences — update them in My Profile.
      </p>

      {l && (
        <div className="grid">
          {l.map(u => (
            <Card key={u.id} u={u} reload={load} />
          ))}
        </div>
      )}

      {l && !l.length && <p>No matches yet.</p>}
    </div>
  );
}

// ==========================================
// SEARCH
// ==========================================

function Search() {
  const [f, setF] = useState({
    age_min: 18,
    age_max: 60,
    religion: '',
    education: '',
    city: '',
    name: ''
  });

  const [l, setL] = useState([]);

  const run = useCallback(
    () =>
      api('/search?' + new URLSearchParams(f))
        .then(setL)
        .catch(() => {}),
    [f]
  );

  useEffect(() => {
    run();
  }, []);

  const s = k => e =>
    setF({ ...f, [k]: e.target.value });

  return (
    <div className="wrap">
      <h2>Search profiles</h2>

      <div className="card" style={{ marginBottom: 20 }}>
        <div
          className="row"
          style={{
            gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))'
          }}
        >
          <div>
            <label>Name</label>
            <input value={f.name} onChange={s('name')} />
          </div>

          <div>
            <label>Min age</label>
            <input
              type="number"
              value={f.age_min}
              onChange={s('age_min')}
            />
          </div>

          <div>
            <label>Max age</label>
            <input
              type="number"
              value={f.age_max}
              onChange={s('age_max')}
            />
          </div>

          <div>
            <label>Religion</label>

            <select value={f.religion} onChange={s('religion')}>
              <option value="">Any</option>

              {RELIGIONS.map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Education</label>
            <input value={f.education} onChange={s('education')} />
          </div>

          <div>
            <label>City</label>
            <input value={f.city} onChange={s('city')} />
          </div>
        </div>

        <br />

        <button onClick={run}>🔍 Search</button>
      </div>

      <div className="grid">
        {l.map(u => (
          <Card key={u.id} u={u} reload={run} />
        ))}
      </div>

      {!l.length && <p>No profiles found.</p>}
    </div>
  );
}

// ==========================================
// PROFILE VIEW
// ==========================================

function ProfileView() {
  const { id } = useParams();

  const [u, setU] = useState(null);

  const load = () =>
    api('/profile/' + id)
      .then(setU)
      .catch(() => {});

  useEffect(() => {
    load();
  }, [id]);

  if (!u) {
    return <div className="wrap">Loading…</div>;
  }

  const rep = async () => {
    const r = prompt('Why are you reporting this profile?');

    if (r) {
      await api('/report', {
        method: 'POST',
        body: {
          target_id: u.id,
          reason: r
        }
      });

      toast('Report sent to admin');
    }
  };

  return (
    <div className="wrap">
      <div
        className="card"
        style={{
          maxWidth: 640,
          margin: 'auto',
          textAlign: 'center'
        }}
      >
        <Av u={u} s={140} />

        <h2>{u.name}, {u.age}</h2>

        <div className="det" style={{ textAlign: 'left' }}>
          {[
            ['Religion', u.religion],
            ['Community', u.community],
            ['Education', u.education],
            ['Profession', u.profession],
            ['City', u.city],
            ['Height', u.height]
          ].map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              {v || '—'}
            </div>
          ))}
        </div>

        <p style={{ color: 'var(--mut)' }}>
          {u.about}
        </p>

        {u.interest ? (
          <span className="pill">{u.interest}</span>
        ) : (
          <button
            onClick={async () => {
              await api('/interests', {
                method: 'POST',
                body: { to_id: u.id }
              });

              toast('Interest sent 💌');
              load();
            }}
          >
            ♥ Send Interest
          </button>
        )}

        {' '}

        <button className="ghost sm" onClick={rep}>
          ⚑ Report
        </button>
      </div>
    </div>
  );
}

// ==========================================
// INTERESTS
// ==========================================

function Interests() {
  const [l, setL] = useState([]);
  const [t, setT] = useState('received');

  const load = () =>
    api('/interests')
      .then(setL)
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const act = async (i, a) => {
    await api(`/interests/${i}/${a}`, {
      method: 'POST'
    });

    toast(
      a === 'accept'
        ? 'Accepted — you can chat now 💬'
        : 'Declined'
    );

    load();
  };

  const rows = l.filter(i =>
    t === 'accepted'
      ? i.status === 'accepted'
      : i.direction === t && i.status !== 'accepted'
  );

  return (
    <div className="wrap">
      <h2>Interests</h2>

      <div className="tabs">
        {['received', 'sent', 'accepted'].map(x => (
          <button
            key={x}
            className={t === x ? 'on' : ''}
            onClick={() => setT(x)}
          >
            {x[0].toUpperCase() + x.slice(1)} (
            {l.filter(i =>
              x === 'accepted'
                ? i.status === 'accepted'
                : i.direction === x && i.status !== 'accepted'
            ).length}
            )
          </button>
        ))}
      </div>

      <div className="grid">
        {rows.map(i => (
          <div className="card pc" key={i.id}>
            <Link to={'/u/' + i.user.id}>
              <Av u={i.user} s={80} />
              <h3>{i.user.name}, {i.user.age}</h3>
            </Link>

            <p>
              {i.user.profession} • {i.user.city}
            </p>

            {i.status === 'pending' && i.direction === 'received' ? (
              <>
                <button
                  className="sm"
                  onClick={() => act(i.id, 'accept')}
                >
                  Accept
                </button>

                {' '}

                <button
                  className="sm ghost"
                  onClick={() => act(i.id, 'decline')}
                >
                  Decline
                </button>
              </>
            ) : (
              <span className="pill">{i.status}</span>
            )}
          </div>
        ))}
      </div>

      {!rows.length && <p>Nothing here yet.</p>}
    </div>
  );
}

// ==========================================
// CHAT
// ==========================================

function Chat() {
  const { user } = useAuth();

  const [list, setList] = useState([]);
  const [sel, setSel] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState('');

  const end = useRef();

  useEffect(() => {
    api('/chats')
      .then(setList)
      .catch(() => {});
  }, []);

  const pull = useCallback(
    () =>
      sel &&
      api('/chat/' + sel.id)
        .then(setMsgs)
        .catch(() => {}),
    [sel]
  );

  useEffect(() => {
    pull();

    const t = setInterval(pull, 3000);

    return () => clearInterval(t);
  }, [pull]);

  useEffect(() => {
    end.current?.scrollIntoView();
  }, [msgs]);

  const send = async e => {
    e.preventDefault();

    if (!txt.trim()) return;

    await api('/chat/' + sel.id, {
      method: 'POST',
      body: { body: txt }
    });

    setTxt('');
    pull();
  };

  return (
    <div className="wrap">
      <h2>Chat</h2>

      <div className="chat">
        <div className="card side">
          {list.map(u => (
            <div
              key={u.id}
              className={sel?.id === u.id ? 'on' : ''}
              onClick={() => setSel(u)}
            >
              <Av u={u} s={40} />
              {u.name}
            </div>
          ))}

          {!list.length && (
            <p>Chat unlocks once an interest is accepted.</p>
          )}
        </div>

        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {sel ? (
            <>
              <b>{sel.name}</b>

              <div className="msgs">
                {msgs.map(m => (
                  <div
                    key={m.id}
                    className={'m ' + (m.from_id === user.id ? 'me' : '')}
                  >
                    {m.body}
                  </div>
                ))}

                <div ref={end} />
              </div>

              <form
                onSubmit={send}
                style={{ display: 'flex', gap: 8 }}
              >
                <input
                  value={txt}
                  onChange={e => setTxt(e.target.value)}
                  placeholder="Type a message…"
                />

                <button>Send</button>
              </form>
            </>
          ) : (
            <p>Select a match to start chatting.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PROFILE SETTINGS
// ==========================================

function Profile() {
  const { user, load } = useAuth();

  const [f, setF] = useState(user);
  const [p, setP] = useState(user.prefs);

  const s = k => e =>
    setF({ ...f, [k]: e.target.value });

  const sp = k => e =>
    setP({ ...p, [k]: e.target.value });

  const save = async e => {
    e.preventDefault();

    await api('/me', {
      method: 'PUT',
      body: f
    });

    await api('/prefs', {
      method: 'PUT',
      body: {
        ...p,
        age_min: +p.age_min,
        age_max: +p.age_max
      }
    });

    await load();

    toast('Profile saved ✓');
  };

  const up = async e => {
    const fd = new FormData();

    fd.append('file', e.target.files[0]);

    const r = await api('/me/photo', {
      method: 'POST',
      form: fd
    });

    setF({ ...f, photo: r.photo });

    load();
  };

  const T = (k, l) => (
    <div className="f">
      <label>{l}</label>

      <input
        value={f[k] || ''}
        onChange={s(k)}
      />
    </div>
  );

  return (
    <div className="wrap">
      <form
        className="card"
        style={{ maxWidth: 720, margin: 'auto' }}
        onSubmit={save}
      >
        <div style={{ textAlign: 'center' }}>
          <Av u={f} s={110} />

          <br />

          <label>
            Change photo

            <input
              type="file"
              accept="image/*"
              onChange={up}
            />
          </label>
        </div>

        <h3>About me</h3>

        <div className="row">
          {T('name', 'Name')}

          <div className="f">
            <label>Date of birth</label>

            <input
              type="date"
              value={f.dob}
              onChange={s('dob')}
            />
          </div>

          <div className="f">
            <label>Religion</label>

            <select
              value={f.religion || ''}
              onChange={s('religion')}
            >
              <option value="">Select</option>

              {RELIGIONS.map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          {T('community', 'Community')}
          {T('education', 'Education')}
          {T('profession', 'Profession')}
          {T('city', 'City')}
          {T('height', 'Height')}
        </div>

        <div className="f">
          <label>About</label>

          <textarea
            rows={3}
            value={f.about || ''}
            onChange={s('about')}
          />
        </div>

        <h3>Partner preferences</h3>

        <div className="row">
          <div className="f">
            <label>Age from</label>

            <input
              type="number"
              value={p.age_min}
              onChange={sp('age_min')}
            />
          </div>

          <div className="f">
            <label>Age to</label>

            <input
              type="number"
              value={p.age_max}
              onChange={sp('age_max')}
            />
          </div>

          <div className="f">
            <label>Religion</label>

            <select
              value={p.religion}
              onChange={sp('religion')}
            >
              <option value="">Any</option>

              {RELIGIONS.map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="f">
            <label>Education</label>

            <input
              value={p.education}
              onChange={sp('education')}
            />
          </div>

          <div className="f">
            <label>City</label>

            <input
              value={p.city}
              onChange={sp('city')}
            />
          </div>
        </div>

        <button>Save Changes</button>
      </form>
    </div>
  );
}

// ==========================================
// ADMIN PANEL
// ==========================================

function Admin() {
  const [t, setT] = useState('stats');
  const [d, setD] = useState(null);

  const load = useCallback(
    () =>
      api('/admin/' + (t === 'stats' ? 'stats' : t))
        .then(setD)
        .catch(() => {}),
    [t]
  );

  useEffect(() => {
    setD(null);
    load();
  }, [t]);

  const post = async (path, body) => {
    await api(path, {
      method: 'POST',
      body
    });

    load();
  };

  return (
    <div className="wrap">
      <h2>Admin Panel</h2>

      <div className="tabs">
        {[
          ['stats', 'Overview'],
          ['users', 'Users'],
          ['faces', 'Face Review'],
          ['reports', 'Reports']
        ].map(([k, l]) => (
          <button
            key={k}
            className={t === k ? 'on' : ''}
            onClick={() => setT(k)}
          >
            {l}
          </button>
        ))}
      </div>

      {d && t === 'stats' && (
        <div className="stats">
          {[
            ['users', 'Members'],
            ['active', 'Active'],
            ['faces', 'Face reviews pending'],
            ['reports', 'Open reports'],
            ['interests', 'Interests'],
            ['messages', 'Messages']
          ].map(([k, l]) => (
            <div className="card" key={k}>
              <b>{d[k]}</b>
              {l}
            </div>
          ))}

          <div className="card">
            <small>Face engine: {d.face_mode}</small>
          </div>
        </div>
      )}

      {d && t === 'users' && (
        <div className="card" style={{ overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {d.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span className="pill">{u.status}</span>
                  </td>

                  <td>
                    {u.status === 'suspended' || u.status === 'review' ? (
                      <button
                        className="sm"
                        onClick={() =>
                          post(`/admin/users/${u.id}/status`, {
                            status: 'active'
                          })
                        }
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        className="sm red"
                        onClick={() =>
                          post(`/admin/users/${u.id}/status`, {
                            status: 'suspended'
                          })
                        }
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {d && t === 'faces' && (
        <div className="grid">
          {d.map(f => (
            <div className="card" key={f.id}>
              <b>Possible duplicate</b>

              <p>
                <Av u={f.user} s={40} />
                <b>{f.user.name}</b> looks like
                <b>{f.match.name}</b>
              </p>

              <span className="pill">{f.status}</span>

              {f.status === 'pending' && (
                <p>
                  <button
                    className="sm"
                    onClick={() =>
                      post('/admin/faces/' + f.id, {
                        decision: 'approve'
                      })
                    }
                  >
                    Approve (different person)
                  </button>

                  {' '}

                  <button
                    className="sm red"
                    onClick={() =>
                      post('/admin/faces/' + f.id, {
                        decision: 'reject'
                      })
                    }
                  >
                    Reject (suspend)
                  </button>
                </p>
              )}
            </div>
          ))}

          {!d.length && <p>Queue is empty 🎉</p>}
        </div>
      )}

      {d && t === 'reports' && (
        <div className="grid">
          {d.map(r => (
            <div className="card" key={r.id}>
              <b>{r.target_user.name}</b>
              reported by {r.reporter}

              <p>“{r.reason}”</p>

              <span className="pill">{r.status}</span>

              {r.status === 'open' && (
                <p>
                  <button
                    className="sm red"
                    onClick={() =>
                      post(`/admin/reports/${r.id}/suspend`)
                    }
                  >
                    Suspend user
                  </button>

                  {' '}

                  <button
                    className="sm ghost"
                    onClick={() =>
                      post(`/admin/reports/${r.id}/dismiss`)
                    }
                  >
                    Dismiss
                  </button>
                </p>
              )}
            </div>
          ))}

          {!d.length && <p>No reports.</p>}
        </div>
      )}
    </div>
  );
}

// ==========================================
// AUTH GUARD
// ==========================================

const Guard = ({ children, admin }) => {
  const { user, ready } = useAuth();

  if (!ready) return null;

  if (!user) return <Navigate to="/login" />;

  if (admin && user.role !== 'admin') {
    return <Navigate to="/matches" />;
  }

  return children;
};

// ==========================================
// MAIN APP
// ==========================================

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState('');

  // Toast notifications
  toast = m => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3500);
  };

  // Load current user
  const load = useCallback(async () => {
    if (!localStorage.getItem('t')) {
      setUser(null);
      setReady(true);
      return;
    }

    try {
      setUser(await api('/me'));
    } catch {
      localStorage.removeItem('t');
      setUser(null);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    load();
  }, []);

  // Logout
  const logout = () => {
    localStorage.removeItem('t');
    setUser(null);
  };

  return (
    <Auth.Provider value={{ user, ready, load, logout }}>
      <BrowserRouter>
        <Nav />

        {user?.status === 'review' && (
          <div className="banner">
            ⏳ Your account is under admin review
            (possible duplicate). You'll get access once approved.
          </div>
        )}

        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route
            path="/matches"
            element={
              <Guard>
                <Matches />
              </Guard>
            }
          />

          <Route
            path="/search"
            element={
              <Guard>
                <Search />
              </Guard>
            }
          />

          <Route
            path="/u/:id"
            element={
              <Guard>
                <ProfileView />
              </Guard>
            }
          />

          <Route
            path="/interests"
            element={
              <Guard>
                <Interests />
              </Guard>
            }
          />

          <Route
            path="/chat"
            element={
              <Guard>
                <Chat />
              </Guard>
            }
          />

          <Route
            path="/profile"
            element={
              <Guard>
                {user && <Profile key={user.id} />}
              </Guard>
            }
          />

          <Route
            path="/admin"
            element={
              <Guard admin>
                <Admin />
              </Guard>
            }
          />
        </Routes>

        {msg && <div className="toast">{msg}</div>}
      </BrowserRouter>
    </Auth.Provider>
  );
}
