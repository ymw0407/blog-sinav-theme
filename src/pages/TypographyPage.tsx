export default function TypographyPage() {
  return (
    <div className="card prose enter">
      <h1 style={{ marginTop: 0 }}>Typography</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        본문 가독성(폭 760px, line-height 1.75)을 최우선으로 둔 타이포 샘플.
      </p>

      <div className="mdx">
        <h2>Heading 2</h2>
        <p>
          문단 여백과 줄간격을 넉넉하게. 링크는 기본적으로 무채색이며 <a href="#">hover 시만</a> 포인트 컬러가
          적용됩니다.
        </p>
        <h3>Heading 3</h3>
        <ul>
          <li>리스트 간격</li>
          <li>
            인라인 코드: <code>const x = 1</code>
          </li>
        </ul>
        <pre>
          <code>{`function hello(name: string) {\n  return 'hello ' + name;\n}`}</code>
        </pre>
        <blockquote>블록쿼트는 muted 톤 + 좌측 보더만.</blockquote>
        <hr />
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>accent</td>
              <td>restricted usage</td>
            </tr>
            <tr>
              <td>spacing</td>
              <td>generous</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

