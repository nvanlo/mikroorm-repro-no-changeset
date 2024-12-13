import {
    Collection,
    Entity,
    ManyToOne,
    MikroORM,
    OneToMany,
    PrimaryKey,
    Property,
    ref,
    Ref,
} from "@mikro-orm/sqlite";

@Entity()
class User {
    @PrimaryKey()
    id!: number;

    @Property()
    name: string;

    @Property()
    email: string;

    @OneToMany(() => Address, (address) => address.user, {eager: false})
    addresses = new Collection<Address>(this);

    constructor(name: string, email: string) {
        this.name = name;
        this.email = email;
    }
}

@Entity()
class Address {
    @Property({primary: true})
    id!: number;

    @Property()
    type: string;

    @Property()
    country: string;

    @ManyToOne(() => User)
    user: Ref<User>;

    constructor(type: string, country: string, user: User) {
        this.type = type;
        this.country = country;
        this.user = ref(user);
    }
}

let orm: MikroORM;

beforeAll(async () => {
    orm = await MikroORM.init({
        dbName: ":memory:",
        entities: [User],
        debug: ["query", "query-params"],
        allowGlobalContext: true, // only for testing
    });
    await orm.schema.refreshDatabase();
});

afterEach(async () => {
    await orm.em.removeAndFlush(orm.em.getReference(Address, 1))
    await orm.em.removeAndFlush(orm.em.getReference(User, 1));
});

afterAll(async () => {
    await orm.close(true);
});

test("create user and address with same id throws unique constraint exception", async () => {
    const user = orm.em.create(User, {name: "User", email: "foo"});
    orm.em.create(Address, {
        id: 1,
        type: "home",
        user: user,
        country: "Belgium",
    });
    await orm.em.flush();

    await expect(async () => {
        orm.em.create(Address, {
            id: 1,
            type: "home",
            user: user,
            country: "Belgium",
        });
        await orm.em.flush();
    }).rejects.toThrowError();
});

test("Creating address with the same id should always throw a constraint exception", async () => {
    const user = orm.em.create(User, {name: "User", email: "foo"});
    orm.em.create(Address, {
        id: 1,
        type: "home",
        user: user,
        country: "Belgium",
    });
    await orm.em.flush();
    orm.em.clear()

    await expect(async () => {
        const user = await orm.em.findOneOrFail(User, {id: 1});
        orm.em.create(Address, {
            id: 1,
            type: "home",
            user: user,
            country: "Belgium",
        });
        await orm.em.flush();
    }).rejects.toThrowError();
});


