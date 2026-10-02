import { JSON10 } from 'json10/src';
import {
  DefaultMapping,
  decodeMappingForHeaderJson,
  encodeMapping,
} from 'ng2-rest/src';
import { CLASS } from 'typescript-class-helpers/src';

//#region models

@CLASS.NAME('Person')
@DefaultMapping<Person>(() => ({
  '': Person,
  friend: Person,
}))
class Person {
  name!: string;

  friend?: Person;

  get label(): string {
    return `Person: ${this.name}`;
  }
}

@CLASS.NAME('Team')
@DefaultMapping<Team>(() => ({
  '': Team,
  leader: Person,
  'leader.friend': Person,
}))
class Team {
  name!: string;

  leader!: Person;

  get displayName(): string {
    return `Team: ${this.name}`;
  }
}

//#endregion

describe('JSON10 + mapping integration', () => {
  it('should preserve class mapping and root circular reference', () => {
    const source = new Person();
    source.name = 'Dariusz';
    source.friend = source;

    // mapping metadata normally transported in HTTP header
    const mapping = decodeMappingForHeaderJson(source);

    // JSON body transport
    let circs: any[] = [];

    const json = JSON10.stringify(source, undefined, undefined, value => {
      circs = value;
    });

    // simulate receiving plain JSON
    const parsed = JSON10.parse(json);

    expect(parsed).not.toBeInstanceOf(Person);
    expect(parsed.friend).toBeNull();

    // restore classes
    const mapped = encodeMapping<Person>(parsed, mapping!);

    expect(mapped).toBeInstanceOf(Person);
    expect(mapped.name).toBe('Dariusz');
    expect(mapped.label).toBe('Person: Dariusz');

    // restore circular references
    const restored = JSON10.applyCircularMapping(mapped, circs);

    expect(restored).toBeInstanceOf(Person);
    expect(restored.friend).toBe(restored);
    expect(restored.label).toBe('Person: Dariusz');
  });

  it('should preserve nested classes together with circular references', () => {
    const team = new Team();
    team.name = 'Taon';

    const leader = new Person();
    leader.name = 'Dariusz';

    const friend = new Person();
    friend.name = 'John';

    team.leader = leader;
    leader.friend = friend;
    friend.friend = leader;

    const mapping = decodeMappingForHeaderJson(team);

    let circs: any[] = [];

    const json = JSON10.stringify(team, undefined, undefined, value => {
      circs = value;
    });

    const parsed = JSON10.parse(json);

    expect(parsed).not.toBeInstanceOf(Team);
    expect(parsed.leader).not.toBeInstanceOf(Person);

    const mapped = encodeMapping<Team>(parsed, mapping!);

    expect(mapped).toBeInstanceOf(Team);
    expect(mapped.leader).toBeInstanceOf(Person);
    expect(mapped.leader.friend).toBeInstanceOf(Person);

    const restored = JSON10.applyCircularMapping(mapped, circs);

    expect(restored.displayName).toBe('Team: Taon');

    expect(restored.leader.name).toBe('Dariusz');
    expect(restored.leader.label).toBe('Person: Dariusz');

    expect(restored.leader.friend!.name).toBe('John');
    expect(restored.leader.friend!.label).toBe('Person: John');

    expect(restored.leader.friend!.friend).toBe(restored.leader);
  });

  it('should preserve circular reference from nested class back to root class', () => {
    @CLASS.NAME('Node')
    class Node {
      name!: string;

      root?: Graph;
    }

    @CLASS.NAME('Graph')
    @DefaultMapping<Graph>(() => ({
      '': Graph,
      node: Node,
    }))
    class Graph {
      name!: string;

      node!: Node;
    }

    const source = new Graph();
    source.name = 'root';

    source.node = new Node();
    source.node.name = 'child';
    source.node.root = source;

    const mapping = decodeMappingForHeaderJson(source);

    let circs: any[] = [];

    const json = JSON10.stringify(source, undefined, undefined, value => {
      circs = value;
    });

    const parsed = JSON10.parse(json);

    const mapped = encodeMapping<Graph>(parsed, mapping!);
    const restored = JSON10.applyCircularMapping(mapped, circs);

    expect(restored).toBeInstanceOf(Graph);
    expect(restored.node).toBeInstanceOf(Node);

    expect(restored.node.root).toBe(restored);
  });

  it('should preserve array class mapping together with circular references', () => {
    const alice = new Person();
    alice.name = 'Alice';

    const bob = new Person();
    bob.name = 'Bob';

    alice.friend = bob;
    bob.friend = alice;

    const source = [alice, bob];

    const mapping = decodeMappingForHeaderJson(source);

    let circs: any[] = [];

    const json = JSON10.stringify(source, undefined, undefined, value => {
      circs = value;
    });

    const parsed = JSON10.parse(json);

    // expect(parsed[0]).not.toBeInstanceOf(Person);
    // expect(parsed[1]).be.toBeNull();

    const mapped = encodeMapping<Person[]>(parsed, mapping!);

    expect(mapped[0]).toBeInstanceOf(Person);

    const restored = JSON10.applyCircularMapping(mapped, circs);

    expect(mapped[1]).toBeInstanceOf(Person);

    expect(restored[0].name).toBe('Alice');
    expect(restored[1].name).toBe('Bob');

    expect(restored[0].label).toBe('Person: Alice');
    expect(restored[1].label).toBe('Person: Bob');

    expect(restored[0].friend).toBe(restored[1]);
    expect(restored[1].friend).toBe(restored[0]);
  });

  it('should survive complete simulated HTTP transport', () => {
    const source = new Person();
    source.name = 'Dariusz';
    source.friend = source;

    //
    // BACKEND
    //

    const mappingHeader = JSON.stringify(decodeMappingForHeaderJson(source));

    let circularHeader: any[] = [];

    const body = JSON10.stringify(source, undefined, undefined, circs => {
      circularHeader = circs;
    });

    //
    // pretend everything crossed HTTP here
    //

    const receivedMappingHeader = JSON.parse(mappingHeader);

    // You could serialize this header too if that is how
    // your real transport works.
    const receivedCircularHeader = JSON.parse(JSON.stringify(circularHeader));

    const receivedBody = JSON10.parse(body);

    //
    // FRONTEND
    //

    const mapped = encodeMapping<Person>(receivedBody, receivedMappingHeader);

    const result = JSON10.applyCircularMapping(mapped, receivedCircularHeader);

    expect(result).toBeInstanceOf(Person);

    expect(result.name).toBe('Dariusz');
    expect(result.label).toBe('Person: Dariusz');

    expect(result.friend).toBe(result);

    // especially important:
    expect(result.friend).toBeInstanceOf(Person);
    expect(result.friend!.label).toBe('Person: Dariusz');
  });
});
