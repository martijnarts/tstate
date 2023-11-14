import {
  StateDefinition_Events,
  createStateDefinition,
  createStateMachine,
} from "./fsm";
import { test, expectTypeOf, expect } from "vitest";

test("state definition typings", () => {
  const def = createStateDefinition({
    on: {
      foo: {
        target: "bar",
      },
      bar: {
        target: "init",
      },
    },
  });

  const x: StateDefinition_Events<typeof def> = "foo";
  expectTypeOf(x).toEqualTypeOf<"foo" | "bar">;
});

test("a basic machine transitions", () => {
  const machine = createStateMachine(
    {
      init: createStateDefinition({
        on: {
          foo: {
            target: "bar",
          },
          bar: {
            target: "init",
          },
        },
      }),
      bar: createStateDefinition({
        on: {
          baz: {
            target: "init",
          },
        },
      }),
    },
    "init"
  );

  const res = machine.send("foo");
  expect(res.value).toEqual("bar");

  const res2 = res.send("baz");
  expect(res2.value).toEqual("init");
});
