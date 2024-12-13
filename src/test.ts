import {
    Collection,
    Entity,
    ManyToOne,
    MikroORM,
    OneToMany,
    Property,
    ref,
    Ref,
} from "@mikro-orm/sqlite";

@Entity()
class User {
    @Property({primary: true})
    name: string;

    @OneToMany(() => Address, (address) => address.user, {eager: false})
    addresses = new Collection<Address>(this);

    constructor(name: string) {
        this.name = name;
    }
}

@Entity()
class Address {
    @Property({primary: true})
    place: string;

    @ManyToOne(() => User)
    user: Ref<User>;

    constructor(country: string, user: User) {
        this.place = country;
        this.user = ref(user);
    }
}

let orm: MikroORM;

beforeEach(async () => {
    orm = await MikroORM.init({
        dbName: ":memory:",
        entities: [User],
        debug: ["query", "query-params"],
        allowGlobalContext: true, // only for testing
    });
    await orm.schema.refreshDatabase();
});

afterEach(async () => {
    await orm.close(true);
});

test("Creating an address with the same id throws a unique constraint error when ser.addresses is not loaded", async () => {
    orm.em.create(Address, {
        user: orm.em.create(User, {name: "Nik"}),
        place: "Belgium",
    });
    await orm.em.flush();
    orm.em.clear()

    const user = await orm.em.findOneOrFail(User, {name: "Nik"});
    await expect(async () => {
        orm.em.create(Address, {
            user: user,
            place: "Belgium",
        });
        await orm.em.flush();
    }).rejects.toThrow(/.*SQLITE_CONSTRAINT.*/);
});

test("Creating an address with the same id throws a unique constraint error when User.addresses is/ populated", async () => {
    orm.em.create(Address, {
        user: orm.em.create(User, {name: "Nik"}),
        place: "Belgium",
    });
    await orm.em.flush();
    orm.em.clear()

    const user = await orm.em.findOneOrFail(User, {name: "Nik"}, {populate: ["addresses"]});
    await expect(async () => {
        orm.em.create(Address, {
            user: user,
            place: "Belgium",
        });
        await orm.em.flush();
    }).rejects.toThrow(/.*SQLITE_CONSTRAINT.*/);
});

test("Creating a user with the same name throws a unique constraint", async () => {
    orm.em.create(User, {name: "Nik"})
    await orm.em.flush();
    orm.em.clear()

    await expect(async () => {
        orm.em.create(User, {name: "Nik"})
        await orm.em.flush();
    }).rejects.toThrow(/.*SQLITE_CONSTRAINT.*/);
});

test("Creating a user with the same name throws a unique constraint when user is already fetched before", async () => {
    orm.em.create(User, {name: "Nik"})
    await orm.em.flush();
    orm.em.clear()

    await orm.em.find(User, {name: "Nik"});
    await expect(async () => {
        orm.em.create(User, {name: "Nik"})
        await orm.em.flush();
    }).rejects.toThrow(/.*SQLITE_CONSTRAINT.*/);
});


