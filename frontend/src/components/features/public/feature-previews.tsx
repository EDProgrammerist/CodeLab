import { BookOpen, Check, Code2, FileCode2, MessageSquare, Send } from 'lucide-react';

export function ClassroomFeaturePreview() {
  return <div className="feature-art classroom-art" aria-label="Illustrative classroom activity list">
    <div className="feature-window"><h4><BookOpen />Programming laboratory</h4><div className="preview-tabs"><strong>All activities</strong><span>My submissions</span><span>+</span></div><div className="preview-table"><div><span>Activity</span><span>Session</span></div>{[['Input and output', 'LAB'], ['Variables and data types', 'OC'], ['Working with conditions', 'LAB'], ['Loops and repetition', 'LAB'], ['Methods and parameters', 'OC'], ['Arrays and collections', 'LAB']].map(([title, session])=><div key={title}><span><FileCode2 />{title}</span><span className={session === 'LAB' ? 'preview-tag-blue' : 'preview-tag-yellow'}>{session}</span></div>)}</div></div>
    <div className="preview-floating"><FileCode2 /><span>Your next activity, all in one place.</span><span className="preview-check"><Check /></span></div>
  </div>;
}
export function CodeFeaturePreview() {
  return <div className="feature-art code-art" aria-label="Illustrative Java code submission preview">
    <div className="feature-window"><h4><Code2 />Your next program</h4><div className="preview-tabs"><strong>Main.java</strong><span>Java source</span></div><pre><code><span className="code-purple">public class</span> Main {'{'}{'\n'}{'  '}<span className="code-purple">public static void</span> main(String[] args) {'{'}{'\n'}{'    '}<span className="code-comment">// Start with a little curiosity.</span>{'\n'}{'    '}<span className="code-purple">int</span> first = <span className="code-blue">12</span>;{'\n'}{'    '}<span className="code-purple">int</span> second = <span className="code-blue">8</span>;{'\n'}{'\n'}{'    '}System.out.println(first + second);{'\n'}{'  }\n}'}</code></pre></div>
    <div className="code-example"><span>Example input</span><strong>12 &nbsp; 8</strong><span>Expected output</span><strong>20</strong></div><div className="code-submission"><FileCode2 /><strong>Main.java</strong><span>Ready for review</span></div>
    <div className="preview-floating"><span>Share your thinking with your instructor.</span><span className="preview-send"><Send /></span></div>
  </div>;
}
export function FeedbackFeaturePreview() {
  return <div className="feedback-art" aria-label="Illustrative submission history and instructor feedback">
    <div className="feedback-board feature-window"><h4><FileCode2 />Classroom activities</h4><div className="preview-tabs"><strong>All work</strong><span>By activity</span></div><div className="preview-board-columns"><div><span className="preview-tag-yellow">Pending · 2</span><article><strong>Loops and repetition</strong><span>LAB / Assignment</span><small>Continue your draft</small></article><article><strong>Arrays and collections</strong><span>LAB / Activity</span></article></div><div><span className="preview-tag-blue">Submitted · 3</span><article><strong>Input and output</strong><span>Source received</span><small>View feedback</small></article><article><strong>Variables and types</strong><span>Source received</span></article></div></div></div>
    <div className="feedback-message"><div className="feedback-message-cover"/><span className="feedback-avatar"><MessageSquare /></span><h4>Instructor feedback</h4><p className="feedback-student-note">Could you review my approach to the loop?</p><p>Your approach is clear. Look again at the final iteration.</p><p>What happens when the counter equals the length of the array?</p><div className="feedback-source"><FileCode2 /> Main.java <span>Submitted code</span></div><small>Illustrative feedback. Points are awarded by your instructor.</small></div>
  </div>;
}
