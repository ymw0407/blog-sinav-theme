export default function MotionPage() {
  return (
    <div className="grid">
      <div className="col-12 card enter">
        <h1 style={{ marginTop: 0 }}>Motion</h1>
        <p className="muted" style={{ marginTop: 0, marginBottom: 0 }}>
          인터랙션은 빠르게(150~200ms), 배경은 느리게(수십 초), 등장 애니메이션은 fade + translateY.
        </p>
      </div>

      <div className="col-4 card enter">
        <h2 style={{ marginTop: 0 }}>Enter</h2>
        <p className="muted">`.enter` 클래스는 reduced-motion에서 비활성화됩니다.</p>
      </div>
      <div className="col-4 card enter">
        <h2 style={{ marginTop: 0 }}>Hover</h2>
        <p className="muted">카드 hover는 transform -1px 정도만.</p>
      </div>
      <div className="col-4 card enter">
        <h2 style={{ marginTop: 0 }}>Background</h2>
        <p className="muted">AppBackground blob drift(26~34s).</p>
      </div>
    </div>
  );
}

