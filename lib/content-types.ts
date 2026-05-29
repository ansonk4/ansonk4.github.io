export type ProfileLink = {
  label: string;
  href: string;
  icon: string;
};

export type Profile = {
  name: string;
  email: string;
  tagline: string;
  links: ProfileLink[];
};

export type Publication = {
  venue: string;
  year: string;
  accent: "blue" | "green" | "orange";
  title: string;
  authors: Array<{
    name: string;
    highlighted?: boolean;
  }>;
  links?: ProfileLink[];
};

export type Education = {
  degree: string;
  institution: string;
  detail: string;
  year: string;
};
