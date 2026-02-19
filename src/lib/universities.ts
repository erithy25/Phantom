export interface UniversityInfo {
  name: string;
  domain: string;
  lmsType: "canvas" | "moodle" | "blackboard" | null;
}

const UNIVERSITY_DOMAINS: Record<string, UniversityInfo> = {
  "harvard.edu": { name: "Harvard University", domain: "harvard.edu", lmsType: "canvas" },
  "stanford.edu": { name: "Stanford University", domain: "stanford.edu", lmsType: "canvas" },
  "mit.edu": { name: "Massachusetts Institute of Technology", domain: "mit.edu", lmsType: "canvas" },
  "yale.edu": { name: "Yale University", domain: "yale.edu", lmsType: "canvas" },
  "princeton.edu": { name: "Princeton University", domain: "princeton.edu", lmsType: "canvas" },
  "columbia.edu": { name: "Columbia University", domain: "columbia.edu", lmsType: "canvas" },
  "upenn.edu": { name: "University of Pennsylvania", domain: "upenn.edu", lmsType: "canvas" },
  "cornell.edu": { name: "Cornell University", domain: "cornell.edu", lmsType: "canvas" },
  "brown.edu": { name: "Brown University", domain: "brown.edu", lmsType: "canvas" },
  "dartmouth.edu": { name: "Dartmouth College", domain: "dartmouth.edu", lmsType: "canvas" },
  "berkeley.edu": { name: "UC Berkeley", domain: "berkeley.edu", lmsType: "canvas" },
  "ucla.edu": { name: "UCLA", domain: "ucla.edu", lmsType: "canvas" },
  "umich.edu": { name: "University of Michigan", domain: "umich.edu", lmsType: "canvas" },
  "uchicago.edu": { name: "University of Chicago", domain: "uchicago.edu", lmsType: "canvas" },
  "nyu.edu": { name: "New York University", domain: "nyu.edu", lmsType: "canvas" },
  "duke.edu": { name: "Duke University", domain: "duke.edu", lmsType: "canvas" },
  "northwestern.edu": { name: "Northwestern University", domain: "northwestern.edu", lmsType: "canvas" },
  "gatech.edu": { name: "Georgia Institute of Technology", domain: "gatech.edu", lmsType: "canvas" },
  "usc.edu": { name: "University of Southern California", domain: "usc.edu", lmsType: "blackboard" },
  "utexas.edu": { name: "University of Texas at Austin", domain: "utexas.edu", lmsType: "canvas" },
  "wisc.edu": { name: "University of Wisconsin-Madison", domain: "wisc.edu", lmsType: "canvas" },
  "illinois.edu": { name: "University of Illinois Urbana-Champaign", domain: "illinois.edu", lmsType: "canvas" },
  "uw.edu": { name: "University of Washington", domain: "uw.edu", lmsType: "canvas" },
  "ohio-state.edu": { name: "Ohio State University", domain: "ohio-state.edu", lmsType: "canvas" },
  "psu.edu": { name: "Penn State University", domain: "psu.edu", lmsType: "canvas" },
  "ufl.edu": { name: "University of Florida", domain: "ufl.edu", lmsType: "canvas" },
  "unc.edu": { name: "University of North Carolina", domain: "unc.edu", lmsType: "canvas" },
  "virginia.edu": { name: "University of Virginia", domain: "virginia.edu", lmsType: "canvas" },
  "bu.edu": { name: "Boston University", domain: "bu.edu", lmsType: "blackboard" },
  "purdue.edu": { name: "Purdue University", domain: "purdue.edu", lmsType: "canvas" },
};

export function lookupUniversity(email: string): UniversityInfo | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  if (UNIVERSITY_DOMAINS[domain]) {
    return UNIVERSITY_DOMAINS[domain];
  }

  const parts = domain.split(".");
  for (let i = 1; i < parts.length; i++) {
    const parentDomain = parts.slice(i).join(".");
    if (UNIVERSITY_DOMAINS[parentDomain]) {
      return UNIVERSITY_DOMAINS[parentDomain];
    }
  }

  if (domain.endsWith(".edu") || domain.endsWith(".ac.uk") || domain.endsWith(".edu.au")) {
    const name = domain
      .replace(/\.(edu|ac\.uk|edu\.au)$/, "")
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    return {
      name: `${name} University`,
      domain,
      lmsType: null,
    };
  }

  // Fallback for non-university emails (e.g. gmail.com, outlook.com)
  const name = domain
    .split(".")[0]
    .charAt(0).toUpperCase() + domain.split(".")[0].slice(1);

  return {
    name: `${name}`,
    domain,
    lmsType: null,
  };
}
