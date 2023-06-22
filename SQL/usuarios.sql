CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  pwd VARCHAR(100) NOT null,
  token VARCHAR (100) not NULL
);

insert into usuarios (username, email, pwd, token) values ('test', 'test@gmail.com', '123456789', 'ElToken123');