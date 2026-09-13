export type Quote = {
  id: string;
  text: string;
  author_name?: string | null;
};

export type Draw = {
  quote: Quote;
  draw_date: string;
};

export type Profile = {
  id: string;
  nickname: string;
  status: string | null;
  avatar_url: string | null;
  is_admin: boolean;
};
