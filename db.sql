-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointments (
  id bigint NOT NULL DEFAULT nextval('appointments_id_seq'::regclass),
  platform_client_id bigint NOT NULL,
  social_contact_id bigint NOT NULL,
  scheduled_for timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_platform_client_id_fkey FOREIGN KEY (platform_client_id) REFERENCES public.platform_clients(id),
  CONSTRAINT appointments_social_contact_id_fkey FOREIGN KEY (social_contact_id) REFERENCES public.social_contacts(id)
);
CREATE TABLE public.conversations (
  id bigint NOT NULL DEFAULT nextval('conversations_id_seq'::regclass),
  social_contact_id bigint NOT NULL,
  platform_client_id bigint NOT NULL,
  channel text,
  status text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_social_contact_id_fkey FOREIGN KEY (social_contact_id) REFERENCES public.social_contacts(id),
  CONSTRAINT conversations_platform_client_id_fkey FOREIGN KEY (platform_client_id) REFERENCES public.platform_clients(id)
);
CREATE TABLE public.documents (
  id bigint NOT NULL DEFAULT nextval('documents_id_seq'::regclass),
  content text,
  metadata jsonb,
  embedding USER-DEFINED,
  platform_client_id bigint,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT fk_documents_platform_client FOREIGN KEY (platform_client_id) REFERENCES public.platform_clients(id)
);
CREATE TABLE public.message_directions (
  code text NOT NULL,
  display_name text NOT NULL,
  is_inbound boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_directions_pkey PRIMARY KEY (code)
);
CREATE TABLE public.message_types (
  code text NOT NULL,
  display_name text NOT NULL,
  is_media boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_types_pkey PRIMARY KEY (code)
);
CREATE TABLE public.messages (
  id bigint NOT NULL DEFAULT nextval('messages_id_seq'::regclass),
  social_contact_id bigint NOT NULL,
  direction text NOT NULL,
  message_type text DEFAULT 'text'::text,
  content_text text,
  content_media jsonb,
  platform_message_id text,
  created_at timestamp with time zone DEFAULT now(),
  conversation_id bigint,
  sender_type text,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_social_contact_id_fkey FOREIGN KEY (social_contact_id) REFERENCES public.social_contacts(id),
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT fk_messages_message_type FOREIGN KEY (message_type) REFERENCES public.message_types(code),
  CONSTRAINT fk_messages_direction FOREIGN KEY (direction) REFERENCES public.message_directions(code),
  CONSTRAINT fk_messages_sender_type FOREIGN KEY (sender_type) REFERENCES public.sender_types(code)
);
CREATE TABLE public.n8n_chat_histories (
  id integer NOT NULL DEFAULT nextval('n8n_chat_histories_id_seq'::regclass),
  session_id character varying NOT NULL,
  message jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT n8n_chat_histories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.plans (
  id bigint NOT NULL DEFAULT nextval('plans_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  max_contacts integer,
  max_messages_per_month integer,
  support_level text,
  price_monthly numeric,
  features jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.platform_clients (
  id bigint NOT NULL DEFAULT nextval('platform_clients_id_seq'::regclass),
  business_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  subscription_plan text,
  status text DEFAULT 'active'::text,
  whatsapp_phone_id text,
  whatsapp_token text,
  instagram_account_id text,
  instagram_token text,
  messenger_page_id text,
  messenger_token text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  plan_id bigint,
  user_id uuid UNIQUE,
  CONSTRAINT platform_clients_pkey PRIMARY KEY (id),
  CONSTRAINT fk_platform_clients_plan FOREIGN KEY (plan_id) REFERENCES public.plans(id),
  CONSTRAINT platform_clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.sender_types (
  code text NOT NULL,
  display_name text NOT NULL,
  is_human boolean NOT NULL DEFAULT false,
  is_bot boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sender_types_pkey PRIMARY KEY (code)
);
CREATE TABLE public.social_contacts (
  id bigint NOT NULL DEFAULT nextval('social_contacts_id_seq'::regclass),
  platform_client_id bigint NOT NULL,
  platform text NOT NULL,
  platform_user_id text NOT NULL,
  display_name text,
  profile_data jsonb DEFAULT '{}'::jsonb,
  name text,
  surname text,
  email text,
  phone text,
  company text,
  age integer,
  volume integer,
  plan_suggested text,
  qualification_status text DEFAULT 'new'::text,
  data_completeness integer DEFAULT 0,
  first_contact timestamp with time zone DEFAULT now(),
  last_interaction timestamp with time zone DEFAULT now(),
  lead_source text,
  lead_score integer,
  goal jsonb CHECK (jsonb_typeof(goal) = 'array'::text OR goal IS NULL),
  CONSTRAINT social_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT social_contacts_platform_client_id_fkey FOREIGN KEY (platform_client_id) REFERENCES public.platform_clients(id),
  CONSTRAINT fk_social_contacts_platform_client FOREIGN KEY (platform_client_id) REFERENCES public.platform_clients(id)
);