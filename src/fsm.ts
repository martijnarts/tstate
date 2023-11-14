type TSError<S extends string> = never;

type StateDefinition<
  State extends string,
  Events extends string,
  Context extends unknown,
  EventTargetMap extends { [K in Events]: { target: State } }
> = {
  _ctx: Context;
  on: EventTargetMap;
};

export type StateDefinition_Events<Definition extends unknown> = Definition extends {
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
    { [key: string]: { target: States } }
  >;
};

type StateValue<
  State extends string,
  Machine extends MachineDefinition<string>
> = {
  value: State;
  send: <const Event extends StateDefinition_Events<Machine[State]>>(
    event: Event
  ) => StateValue<Machine[State]["on"][Event]["target"], Machine>;
};

export const createStateMachine = <
  const Definition extends MachineDefinition<States>,
  const States extends keyof Definition & string,
  const InitialState extends States
>(
  definition: Definition,
  initialState: InitialState
): StateValue<InitialState, Definition> => {
  return {
    value: initialState,
    send(event) {
      return createStateMachine(
        definition,
        definition[initialState].on[event].target
      );
    },
  } as StateValue<InitialState, Definition>;
};

export const createStateDefinition = <
  Context,
  const Definition extends Omit<
    StateDefinition<
      string,
      string,
      Context,
      { [key: string]: { target: string } }
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
