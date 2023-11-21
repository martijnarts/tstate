type TSError<S extends string> = never;

type Transition<TargetState extends string, SourceContext, TargetContext> = {
  target: TargetState;
  action: (ctx: SourceContext) => TargetContext;
};

type StateDefinition<
  State extends string,
  Events extends string,
  Context extends unknown,
  EventTargetMap extends { [K in Events]: Transition<State, Context, unknown> }
> = {
  _ctx: Context;
  on: EventTargetMap;
};

export type StateDefinition_Events<Definition extends unknown> =
  Definition extends {
    on: { [K in infer Events]: unknown };
  }
    ? Events extends string
      ? Events
      : TSError<"StateDefinition events did not extend string">
    : TSError<"could not infer StateDefinition events">;

type MachineDefinition<States extends string> = {
  [State in string]: StateDefinition<
    States,
    string,
    unknown,
    { [key: string]: Transition<States, unknown, unknown> }
  >;
};

type StateValue<
  State extends string,
  Context,
  Machine extends MachineDefinition<string>
> = {
  value: State;
  context: Context;
  send: <const Event extends StateDefinition_Events<Machine[State]>>(
    event: Event
  ) => StateValue<
    Machine[State]["on"][Event]["target"],
    ReturnType<Machine[State]["on"][Event]["action"]>,
    Machine
  >;
};

export const createStateMachine = <
  const Definition extends MachineDefinition<States>,
  const States extends keyof Definition & string,
  const InitialState extends States,
  const InitialContext extends Definition[InitialState]["_ctx"]
>(
  definition: Definition,
  initialState: InitialState,
  initialContext: InitialContext
): StateValue<InitialState, InitialContext, Definition> => {
  return {
    value: initialState,
    context: initialContext,
    send(event) {
      const transition = definition[initialState].on[event];
      const action = transition.action;
      if (action == null) {
        return createStateMachine(
          definition,
          definition[initialState].on[event].target,
          initialContext
        );
      }

      return createStateMachine(
        definition,
        definition[initialState].on[event].target,
        action(initialContext)
      );
    },
  };
};

export const createStateDefinition = <
  Context,
  const Definition extends Omit<
    StateDefinition<
      string,
      string,
      Context,
      { [Key in string]: Transition<string, Context, unknown> }
    >,
    "_ctx"
  >
>(
  definition: Definition
): StateDefinition<
  Definition["on"][keyof Definition["on"]]["target"],
  StateDefinition_Events<Definition>,
  Context,
  Definition["on"]
> =>
  ({
    ...definition,
    _ctx: undefined as unknown as Context,
  } as StateDefinition<
    Definition["on"][StateDefinition_Events<Definition>]["target"],
    StateDefinition_Events<Definition>,
    Context,
    Definition["on"]
  >);

export const createStateDefinitionWithContext =
  <Context>() =>
  <
    const Definition extends Omit<
      StateDefinition<
        string,
        string,
        Context,
        { [Key in string]: Transition<string, Context, unknown> }
      >,
      "_ctx"
    >
  >(
    definition: Definition
  ) =>
    createStateDefinition<Context, Definition>(definition);

export const createTransition = <
  const TargetState extends string,
  const SourceContext,
  const TargetContext,
  const Arg extends
    | { target: TargetState; action: (ctx: SourceContext) => TargetContext }
    | { target: TargetState; action?: undefined }
>(
  transition: Arg
): Transition<
  TargetState,
  SourceContext,
  Arg extends { action: (ctx: SourceContext) => TargetContext }
    ? TargetContext
    : SourceContext
> => {
  let action = transition.action;
  if (action == null) {
    // TODO(marts): this should be strictly typed.
    action = (ctx: SourceContext) => ctx as unknown as TargetContext;
  }

  return {
    target: transition.target,
    action,
  };
};
