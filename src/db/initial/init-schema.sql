DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS oauth_profiles;
DROP TABLE IF EXISTS refresh_tokens;

-- Enum для провайдерів аутентифікації
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'facebook');

-- Enum для ролей користувача
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Enum для статі користувача
CREATE TYPE user_sex AS ENUM ('male', 'female');

CREATE TABLE users
(
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    name          VARCHAR(255),
    surname       VARCHAR(255),
    phone_number  VARCHAR(255),
    sex           user_sex NOT NULL,
    birth_date    DATE,
    experience    VARCHAR(255),
    weight        FLOAT,
    image_url     VARCHAR(255),
    role          user_role                DEFAULT 'user',
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

);

-- Таблиця OAuth профілів
CREATE TABLE oauth_profiles
(
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER REFERENCES users (id) ON DELETE CASCADE,
    provider         auth_provider NOT NULL,
    provider_user_id VARCHAR(255)  NOT NULL,
    access_token     VARCHAR(255),
    refresh_token    VARCHAR(255),
    profile_data     JSONB, -- Зберігання додаткових даних профілю
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider, provider_user_id)
);

-- Таблиця для зберігання refresh токенів
CREATE TABLE refresh_tokens
(
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users (id) ON DELETE CASCADE,
    token      VARCHAR(255) UNIQUE      NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);