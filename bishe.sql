DROP DATABASE IF EXISTS BiShe;

CREATE DATABASE BiShe
    DEFAULT CHARACTER SET utf8
    DEFAULT COLLATE utf8_general_ci;

USE BiShe;


CREATE TABLE Albums
(
  name VARCHAR(50) UNIQUE PRIMARY KEY,
  title VARCHAR(100),
  date DATETIME,
  description VARCHAR(500),

  -- allow for sorting on date.
  INDEX(date)
)
ENGINE = InnoDB;

CREATE TABLE Photos
(
  album_name VARCHAR(50),
  filename VARCHAR(50),
  description VARCHAR(500),
  date DATETIME,

  FOREIGN KEY (album_name) REFERENCES Albums (name),
  INDEX (album_name, date)
)
ENGINE = InnoDB;


CREATE TABLE Users
(
  user_id INT UNSIGNED AUTO_INCREMENT UNIQUE PRIMARY KEY,
  user_address VARCHAR(150) UNIQUE,


  password VARCHAR(100),

  first_seen_date BIGINT,
  last_modified_date BIGINT,
  deleted BOOL DEFAULT false,

  INDEX(user_address, deleted),
  INDEX(user_id, deleted)
)
ENGINE = InnoDB;

CREATE TABLE Admin
(
  admin_id INT UNSIGNED AUTO_INCREMENT UNIQUE PRIMARY KEY,
  admin_address VARCHAR(150) UNIQUE,


  password VARCHAR(100),

  first_seen_date BIGINT,
  last_modified_date BIGINT,
  deleted BOOL DEFAULT false,

  INDEX(admin_address, deleted),
  INDEX(admin_id, deleted)
)
ENGINE = InnoDB;


