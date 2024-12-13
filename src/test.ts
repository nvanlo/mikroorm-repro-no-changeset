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

    @OneToMany(() => Address, (address) => address.user, {eager: false})
    addresses = new Collection<Address>(this);

    constructor(name: string) {
        this.name = name;
    }
}

@Entity()
class Address {
    @Property({primary: true})
    id!: number;

    @Property()
    country: string;

    @ManyToOne(() => User)
    user: Ref<User>;

    constructor(type: string, country: string, user: User) {
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

test("Creating an address with the same id throws a unique constraint error when ser.addresses is not loaded", async () => {
    orm.em.create(Address, {
        id: 1,
        user: orm.em.create(User, {name: "User"}),
        country: "Belgium",
    });
    await orm.em.flush();
    orm.em.clear()

    const user = await orm.em.findOneOrFail(User, {id: 1});
    await expect(async () => {
        orm.em.create(Address, {
            id: 1,
            user: user,
            country: "Belgium",
        });
        await orm.em.flush();
    }).rejects.toThrowError("dd");
});

test("Creating an address with the same id throws a unique constraint error when User.addresses populated", async () => {
    orm.em.create(Address, {
        id: 1,
        user: orm.em.create(User, {name: "User"}),
        country: "Belgium",
    });
    await orm.em.flush();
    orm.em.clear()

    const user = await orm.em.findOneOrFail(User, {name: "User"}, {populate: ["addresses"]});
    await expect(async () => {
        orm.em.create(Address, {
            id: 1,
            user: user,
            country: "Belgium",
        });
        await orm.em.flush();
    }).rejects.toThrowError("");
});


