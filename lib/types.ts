export type Person = {
  id: string;
  name: string;
};

export type Brain = "light" | "heavy";

export type Film = {
  id: string;
  title: string;
  year: number;
  runtimeMinutes: number;
  weight: Brain;
  service: string;
  genre: string;
};
