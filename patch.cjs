const fs = require('fs');

// Modify App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const importCandidateDashboard = "import CandidateDashboard from './components/CandidateDashboard';";
const importEmployerDashboard = "import CandidateDashboard from './components/CandidateDashboard';\nimport EmployerDashboard from './components/EmployerDashboard';";
appCode = appCode.replace(importCandidateDashboard, importEmployerDashboard);

const oldState = "const [isProfileHomeOpen, setIsProfileHomeOpen] = useState(false);";
const newState = "const [isProfileHomeOpen, setIsProfileHomeOpen] = useState(false);\n  const [isEmployerDashboardOpen, setIsEmployerDashboardOpen] = useState(false);";
appCode = appCode.replace(oldState, newState);

const oldOnComplete = `onComplete={(data: any) => {
            setIsRecruiterRegOpen(false);
            alert(\`Account created for \${data.name || 'Recruiter'} (\${data.company || 'Company'})!\`);
          }}`;
const newOnComplete = `onComplete={(data: any) => {
            setCandidateData(data);
            setIsRecruiterRegOpen(false);
            setIsEmployerDashboardOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}`;
appCode = appCode.replaceAll(oldOnComplete, newOnComplete);

const oldOnCompleteDesktop = `onComplete={(data: any) => {
          setIsRecruiterRegOpen(false);
          alert(\`Account created for \${data.name || 'Recruiter'} (\${data.company || 'Company'})!\`);
        }}`;
const newOnCompleteDesktop = `onComplete={(data: any) => {
          setCandidateData(data);
          setIsRecruiterRegOpen(false);
          setIsEmployerDashboardOpen(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}`;
appCode = appCode.replaceAll(oldOnCompleteDesktop, newOnCompleteDesktop);

const employerComp = `
        <EmployerDashboard
          isOpen={isEmployerDashboardOpen}
          userData={candidateData || {}}
          onClose={() => setIsEmployerDashboardOpen(false)}
          onOpenAuth={() => {
            setIsEmployerDashboardOpen(false);
            setIsAuthOpen(true);
          }}
        />`;

// There are two CandidateDashboard components rendered in App.tsx
// Let's insert EmployerDashboard right after them.
const parts = appCode.split("/>\n      </>\n    );\n  }");
if (parts.length === 3) {
  appCode = parts[0] + "/>" + employerComp + "\n      </>\n    );\n  }" + parts[1] + "/>" + employerComp + "\n      </>\n    );\n  }" + parts[2];
}

fs.writeFileSync('src/App.tsx', appCode);
console.log('App.tsx successfully modified!');
