const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const employerComp = `
        <EmployerDashboard
          isOpen={isEmployerDashboardOpen}
          userData={candidateData || {}}
          onClose={() => setIsEmployerDashboardOpen(false)}
          onOpenAuth={() => {
            setIsEmployerDashboardOpen(false);
            setIsAuthOpen(true);
          }}
        />
`;

// There are three places where CandidateDashboard is rendered. We will replace the closing tags.

// 1. First CandidateDashboard is inside an early return (around line 285)
appCode = appCode.replace(/onOpenAuth=\{\(\) => \{\s*setIsProfileHomeOpen\(false\);\s*setIsAuthOpen\(true\);\s*\}\}\s*\/>\s*<\/>\s*\);\s*\}/, 
`onOpenAuth={() => {
            setIsProfileHomeOpen(false);
            setIsAuthOpen(true);
          }}
        />${employerComp}      </>
    );
  }`);

// 2. Second CandidateDashboard is inside isFreelancersViewOpen return (around line 365)
// Let's do a more robust replace.

appCode = appCode.replace(/<CandidateDashboard[\s\S]*?\/>/g, (match) => {
  return match + employerComp;
});


fs.writeFileSync('src/App.tsx', appCode);
console.log('App.tsx successfully modified to add EmployerDashboard!');
