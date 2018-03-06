create table user_profiles (
	user_id int(11) not null,
    display_name varchar(255) default null,
    gender enum('f', 'm', 'u', 'o') default 'u',
    date_of_birth date default null,
    description text default null,
    mobile varchar(30) default null,
    email varchar(255) default null,
    language varchar(5) default 'en-US',
    country varchar(255),
    state varchar(255),
    city varchar(255),
    location text,
    avatar text,
    grade varchar(255),
    parent_name varchar(255),
    create_at timestamp default current_timestamp,
    update_at timestamp default current_timestamp,


    foreign key fk_user(user_id)
    references users(user_id)

    on update cascade
    on delete restrict
) engine= innoDB