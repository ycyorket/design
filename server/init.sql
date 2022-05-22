create database design;

use design;

create table event_type(
    name varchar(32),
    number varchar(35),
    page_number varchar(35),
    event_type varchar(6),
    description varchar(100),
    custom varchar(100),
    PRIMARY KEY ( number )
);

create table page(
    name varchar(32),
    url varchar(50),
    number varchar(35),
    admin varchar(15),
    password varchar(16),
    description varchar(100),
    PRIMARY KEY ( number )
);

create table events(
    user_id varchar(16),
    id varchar(35),
    device int,
    address varchar(50),
    timestamp bigint,
    custom varchar(400)
);