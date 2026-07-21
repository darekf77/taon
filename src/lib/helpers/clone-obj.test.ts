import { cloneObj } from './clone-obj';

describe('clone base class object', () => {
  it('should not override getters', () => {
    class ProjectMy {
      get locations() {
        return { anything: 'here' };
      }
    }

    const proj = new ProjectMy();

    const overrideGetters = {
      locations: {
        asdasd: 'asda',
      },
    };

    expect(() => {
      cloneObj(overrideGetters, ProjectMy, {
        // throwWhenSetError: true,
      });
    }).not.toThrow();

    expect(
      cloneObj(overrideGetters, ProjectMy, {
        // throwWhenSetError: true,
      }).locations,
    ).toEqual(new ProjectMy().locations);
  });

  it('should try override getters', () => {
    class ProjectMy {
      get locations() {
        return { anything: 'here' };
      }
    }

    const proj = new ProjectMy();

    const overrideGetters = {
      locations: {
        asdasd: 'asda',
      },
    };

    expect(() => {
      cloneObj(overrideGetters, ProjectMy, {
        throwWhenSetError: true,
      });
    }).toThrow();

    expect(
      cloneObj(overrideGetters, ProjectMy, {
        throwWhenSetError: true,
      }).locations,
    ).toEqual(new ProjectMy().locations);
  });
});
