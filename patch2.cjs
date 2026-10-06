const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(/onComplete=\{\(data: any\) => \{\s*setIsRecruiterRegOpen\(false\);\s*alert\([\s\S]*?\);\s*\}\}/g, `onComplete={(data: any) => {
            setCandidateData(data);
            setIsRecruiterRegOpen(false);
            setIsEmployerDashboardOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}`);

fs.writeFileSync('src/App.tsx', appCode);
console.log('App.tsx successfully modified!');
