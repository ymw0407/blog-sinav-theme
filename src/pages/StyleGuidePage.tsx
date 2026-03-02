export default function StyleGuidePage() {
  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Style Guide</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        미니멀(무채색) + 포인트 컬러(제한된 영역) + 여백 중심.
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <h2 style={{ marginTop: 0 }}>Buttons</h2>
        <div className="row">
          <button className="btn">Default</button>
          <button className="btn primary">Primary</button>
          <button className="btn danger">Danger</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2 style={{ marginTop: 0 }}>Pills</h2>
        <div className="row">
          <span className="pill">#tag</span>
          <span className="pill selected">#selected</span>
          <span className="pill">meta</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2 style={{ marginTop: 0 }}>Form</h2>
        <div className="grid">
          <div className="col-6">
            <label className="muted">Title</label>
            <input className="input" placeholder="input" />
          </div>
          <div className="col-6">
            <label className="muted">Category</label>
            <select className="select">
              <option>dev</option>
              <option>travel</option>
              <option>photo</option>
            </select>
          </div>
          <div className="col-12">
            <label className="muted">Body</label>
            <textarea className="textarea" placeholder="textarea" />
          </div>
        </div>
      </div>
    </div>
  );
}

