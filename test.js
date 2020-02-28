const assert = require("assert");

/*------------------/
     START TESTS
/------------------*/
// write simple tests here, for more depth grab something like Jest

test("one plus two is three", async () => {
  assert(2 + 1 === 3);
});

test("this fails", () => {
  throw new Error("deliberate error");
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
