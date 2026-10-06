const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'CandidateDashboard.css');
let content = fs.readFileSync(file, 'utf8');

// The incorrect string is ".candidate-dashboard-container.employer-view, .candidate-dashboard-container.candidate-view"
// We want to replace it in a smart way.
// Any line like:
// .candidate-dashboard-container.employer-view, .candidate-dashboard-container.candidate-view .some-class {
// Should become:
// .candidate-dashboard-container.employer-view .some-class,
// .candidate-dashboard-container.candidate-view .some-class {

content = content.replace(/\.candidate-dashboard-container\.employer-view, \.candidate-dashboard-container\.candidate-view([^\{]*)\{/g, (match, suffix) => {
    const trimmedSuffix = suffix.trim();
    if (trimmedSuffix === '') {
        return '.candidate-dashboard-container.employer-view, .candidate-dashboard-container.candidate-view {';
    }
    return `.candidate-dashboard-container.employer-view ${trimmedSuffix},\n.candidate-dashboard-container.candidate-view ${trimmedSuffix} {`;
});

// Also fix hover states:
content = content.replace(/\.candidate-dashboard-container\.employer-view, \.candidate-dashboard-container\.candidate-view (\.x-card:hover| \.candidate-card:hover| \.lead-card:hover| \.plan-card:hover)/g, '.candidate-dashboard-container.employer-view $1, .candidate-dashboard-container.candidate-view $1');

fs.writeFileSync(file, content);
console.log('Fixed CSS');
