// generated by http://npmjs.com/tinit

const assert = require("assert");
const { applyMiddleware, createStore } = require("redux");
const { StoreService } = require("./lib/StoreService");
const { default: utils } = require("./lib/utils");

/*------------------/
     START TESTS
/------------------*/
// write simple tests here, for more depth grab something like Jest

let store;
let service;
let counterReducer;

const ACTION = {
  INCREASE: "INCREASE",
  DECREASE: "DECREASE"
};
test("util: object pathing", () => {
  assert(utils.isDotPath("this.that.theother"));
  assert(utils.isDotPath("propOnItsOwn"));

  const testObject = { hello: { world: true } };
  assert.equal(utils.lookup(testObject, "hello.world"), true);

  utils.set(testObject, "hello.world", false);
  assert.equal(utils.lookup(testObject, "hello.world"), false);
  assert.equal(testObject.hello.world, false);
});

test("util: top level object diffing", () => {
  const obj1 = {
    a: 0,
    b: 1
  };
  const obj2 = { ...obj1 };
  const topLevelA = utils.objectsMatch(obj1, obj2);
  assert(topLevelA, "cloned objects should be equal");

  obj2.b = 2;
  const topLevelB = utils.objectsMatch(obj1, obj2);
  assert(topLevelB === false, "modified clone objects shouldn't be equal");
});

test("util: sub-object diffing", () => {
  const obj1 = {
    a: { 
      b: {
        c: 2
      }
    }
  };
  const obj2 = {
    a: { 
      b: {
        c: 2
      }
    }
  };
  const topLevelA = utils.objectsMatch(obj1, obj2);
  assert(topLevelA, "subobjects should be matching");

  obj2.a.b.c = 3;
  const topLevelB = utils.objectsMatch(obj1, obj2);
  assert(topLevelB === false, "subobjects shouldn't be matching");
});

test("create an unattached store", () => {
  counterReducer = (state = { value: 0 }, action) => {
    if (action.type === ACTION.INCREASE) {
      state.value += action.payload || 1;
    }
    if (action.type === ACTION.DECREASE) {
      state.value -= action.payload || 1;
    }
    return state;
  };
  store = createStore(counterReducer);
  assert(store);
  for (let i=0; i<3; i++) {
    store.dispatch({ type: ACTION.INCREASE, payload: 1 });
  }
  assert.equal(store.getState().value, 3);
  store.dispatch({ type: ACTION.DECREASE, payload: 2 });
  assert.equal(store.getState().value, 1);
});

test("attach to the store", () => {
  service = StoreService.define("testService",
    class TestService extends StoreService {
      constructor() {
        super("testData", { a: 1, b: 2 });
      }

      increaseA() {
        return this.setState({ a: this.state.a + 1 });
      }
    }
  );
  store = createStore(
    StoreService.wrapReducer(
      counterReducer
    ),
    applyMiddleware(
      StoreService.getMiddleware()
    )
  );
});

test("the service can update itself", () => {
  service.increaseA();
  assert.equal(service.state.a, 2);
});

test("the service can update the store", async () => {
  await service.increaseA();
  const newA = store.getState().testData.a;
  assert.equal(newA, 3);
});

test("the service can introduce properties", async () => {
  await service.setState({ hello: "world" })
  const newValue = store.getState().testData.hello;
  assert.equal(newValue, "world");
});

test("the service works with changes to object properties", async () => {
  await service.setState({ object: { property: 1 } });
  await service.setState({ object: { property: 2 } });
  const newValue = store.getState().testData.object.property;
  assert.equal(newValue, 2);
});


/*------------------/
     END TESTS
/------------------*/

/**
 * @param text printed description of test
 * @param func a function / promise / async that throws upon test fail
 */
function test(text, func) {
  (test.all = test.all || []).push({ i: test.all.length, text, func });
}
(async () => { // autorun
  const log = (msg, c) => process.stdout.write((["\033[32m", "\033[31m"][c] || "")+msg+"\033[0m");
  log("tinit running " + test.all.length + " tests...\n");
  while ((t = test.all.shift())) {
    log(" > " + (t.i+1) + ". " + t.text + "...");
    try { await t.func(); } catch (e) {
      return log("FAIL\n" + (e && e.stack || e) + "\n", 1);
    };
    log("PASS\n", 0);
  }
})();
