import {
  StateDefinition_Events,
  createStateDefinition,
  createStateDefinitionWithContext,
  createStateMachine,
  createTransition,
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
    "init",
    undefined
  );

  const res = machine.send("foo");
  expect(res.value).toEqual("bar");

  const res2 = res.send("baz");
  expect(res2.value).toEqual("init");
});

test("a machine accepts context", () => {
  const machine = createStateMachine(
    {
      init: createStateDefinitionWithContext<{ foo: "bar" }>()({
        on: {
          foo: createTransition({
            target: "bar",
          }),
          bar: createTransition({
            target: "init",
          }),
        },
      }),
      bar: createStateDefinitionWithContext<{ foo: "bar" }>()({
        on: {
          baz: createTransition({
            target: "init",
          }),
        },
      }),
    },
    "init",
    {
      foo: "bar",
    }
  );

  const x: typeof machine = "foo";
  expectTypeOf(x).toEqualTypeOf<"foo" | "bar">;
});
