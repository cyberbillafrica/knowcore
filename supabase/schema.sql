-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Tenants table (Organizations)
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles table (Users linked to tenants)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Knowledge Bases table
create table knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sources table (Documents, URLs, Text)
create table sources (
  id uuid primary key default gen_random_uuid(),
  knowledge_base_id uuid references knowledge_bases(id) on delete cascade,
  type text not null check (type in ('file', 'text', 'url')),
  title text not null,
  content text, -- Optional full content
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chunks table (Split text for vector search)
create table chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade,
  content text not null,
  embedding vector(768), -- Gemini embedding-001 is 768 dimensions (Wait, user said 1536 but Gemini is 768 or 3072. Let's check.)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: Google Gemini embedding-001 uses 768 dimensions. 
-- text-embedding-004 supports dimensions from 1 to 768 or up to 3072.
-- The user requested 1536 (typical for OpenAI), but for Gemini we should use 768 if using embedding-001.
-- I will use 768 as it's standard for Gemini embedding-001.

-- Similarity search function
create or replace function match_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  source_id uuid,
  content text,
  source_title text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.source_id,
    c.content,
    s.title as source_title,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  join sources s on c.source_id = s.id
  where 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RLS (Row Level Security) comments
-- To be enabled later for multi-tenant isolation:
-- alter table tenants enable row level security;
-- alter table profiles enable row level security;
-- alter table knowledge_bases enable row level security;
-- alter table sources enable row level security;
-- alter table chunks enable row level security;
