import {
  getHttpStatusCodeMessages,
  getStatusCode,
  getStatusText,
  HttpStatusCodeEnumMap,
  HttpStatusCodeMap,
  HttpStatusEnum,
} from './http-status';

describe('HttpStatus', () => {
  //#region HttpStatusCodeMap
  describe('HttpStatusCodeMap', () => {
    it('should map success statuses to correct HTTP codes', () => {
      expect(HttpStatusCodeMap[HttpStatusEnum.OK]).toBe(200);
      expect(HttpStatusCodeMap[HttpStatusEnum.CREATED]).toBe(201);
      expect(HttpStatusCodeMap[HttpStatusEnum.ACCEPTED]).toBe(202);
      expect(HttpStatusCodeMap[HttpStatusEnum.NO_CONTENT]).toBe(204);
    });

    it('should map redirect statuses to correct HTTP codes', () => {
      expect(HttpStatusCodeMap[HttpStatusEnum.MOVED_PERMANENTLY]).toBe(301);
      expect(HttpStatusCodeMap[HttpStatusEnum.FOUND]).toBe(302);
      expect(HttpStatusCodeMap[HttpStatusEnum.NOT_MODIFIED]).toBe(304);
    });

    it('should map client error statuses to correct HTTP codes', () => {
      expect(HttpStatusCodeMap[HttpStatusEnum.BAD_REQUEST]).toBe(400);
      expect(HttpStatusCodeMap[HttpStatusEnum.UNAUTHORIZED]).toBe(401);
      expect(HttpStatusCodeMap[HttpStatusEnum.INVALID_TOKEN]).toBe(401);
      expect(HttpStatusCodeMap[HttpStatusEnum.NO_TOKEN]).toBe(401);
      expect(HttpStatusCodeMap[HttpStatusEnum.FORBIDDEN]).toBe(403);
      expect(HttpStatusCodeMap[HttpStatusEnum.NOT_FOUND]).toBe(404);
      expect(HttpStatusCodeMap[HttpStatusEnum.CONFLICT]).toBe(409);
      expect(HttpStatusCodeMap[HttpStatusEnum.UNPROCESSABLE_ENTITY]).toBe(422);
    });

    it('should map server error statuses to correct HTTP codes', () => {
      expect(HttpStatusCodeMap[HttpStatusEnum.INTERNAL_SERVER_ERROR]).toBe(500);
      expect(HttpStatusCodeMap[HttpStatusEnum.BAD_GATEWAY]).toBe(502);
      expect(HttpStatusCodeMap[HttpStatusEnum.SERVICE_UNAVAILABLE]).toBe(503);
    });

    it('should contain mapping for every enum value', () => {
      for (const status of Object.values(HttpStatusEnum)) {
        expect(HttpStatusCodeMap[status]).toBeTypeOf('number');
      }
    });
  });
  //#endregion

  //#region getStatusCode
  describe('getStatusCode', () => {
    it('should return HTTP code for status', () => {
      expect(getStatusCode(HttpStatusEnum.OK)).toBe(200);
      expect(getStatusCode(HttpStatusEnum.NOT_FOUND)).toBe(404);
      expect(getStatusCode(HttpStatusEnum.INTERNAL_SERVER_ERROR)).toBe(500);
    });

    it('should return 401 for all authentication statuses', () => {
      expect(getStatusCode(HttpStatusEnum.UNAUTHORIZED)).toBe(401);
      expect(getStatusCode(HttpStatusEnum.INVALID_TOKEN)).toBe(401);
      expect(getStatusCode(HttpStatusEnum.NO_TOKEN)).toBe(401);
    });
  });
  //#endregion

  //#region messages
  describe('getHttpStatusCodeMessages', () => {
    it('should contain message for every enum value', () => {
      const messages = getHttpStatusCodeMessages();

      for (const status of Object.values(HttpStatusEnum)) {
        expect(messages[status]).toBeTypeOf('string');
        expect(messages[status].length).toBeGreaterThan(0);
      }
    });

    it('should return expected status messages', () => {
      const messages = getHttpStatusCodeMessages();

      expect(messages[HttpStatusEnum.OK]).toBe('OK');
      expect(messages[HttpStatusEnum.CREATED]).toBe('Created');
      expect(messages[HttpStatusEnum.BAD_REQUEST]).toBe('Bad Request');
      expect(messages[HttpStatusEnum.NOT_FOUND]).toBe('Not Found');
      expect(messages[HttpStatusEnum.INVALID_TOKEN]).toBe('Invalid Token');
      expect(messages[HttpStatusEnum.NO_TOKEN]).toBe('No Token');
    });
  });
  //#endregion

  //#region reverse map
  describe('HttpStatusCodeEnumMap', () => {
    it('should reverse unique HTTP codes correctly', () => {
      expect(HttpStatusCodeEnumMap[200]).toBe(HttpStatusEnum.OK);
      expect(HttpStatusCodeEnumMap[201]).toBe(HttpStatusEnum.CREATED);
      expect(HttpStatusCodeEnumMap[404]).toBe(HttpStatusEnum.NOT_FOUND);
      expect(HttpStatusCodeEnumMap[500]).toBe(
        HttpStatusEnum.INTERNAL_SERVER_ERROR,
      );
    });

    it('should use last status when multiple statuses have same HTTP code', () => {
      // UNAUTHORIZED, INVALID_TOKEN and NO_TOKEN all map to 401.
      // Object.fromEntries() keeps the last entry for duplicate keys.
      expect(HttpStatusCodeEnumMap[401]).toBe(HttpStatusEnum.NO_TOKEN);
    });
  });
  //#endregion

  //#region getStatusText
  describe('getStatusText', () => {
    it('should return message for numeric HTTP code', () => {
      expect(getStatusText(200)).toBe('OK');
      expect(getStatusText(201)).toBe('Created');
      expect(getStatusText(404)).toBe('Not Found');
      expect(getStatusText(500)).toBe('Internal Server Error');
    });

    it('should return original value for unknown HTTP code', () => {
      expect(getStatusText(999)).toBe('999');
    });

    it('should return message when enum status is provided', () => {
      expect(getStatusText(HttpStatusEnum.OK)).toBe('OK');
      expect(getStatusText(HttpStatusEnum.NOT_FOUND)).toBe('Not Found');
      expect(getStatusText(HttpStatusEnum.BAD_GATEWAY)).toBe('Bad Gateway');
    });

    it('should handle authentication HTTP code according to reverse map', () => {
      expect(getStatusText(401)).toBe('No Token');
    });

    it('should handle authentication enum statuses', () => {
      expect(getStatusText(HttpStatusEnum.UNAUTHORIZED)).toBe('Unauthorized');
      expect(getStatusText(HttpStatusEnum.INVALID_TOKEN)).toBe('Invalid Token');
      expect(getStatusText(HttpStatusEnum.NO_TOKEN)).toBe('No Token');
    });

    it('should return string representation for falsy numeric value', () => {
      expect(getStatusText(0)).toBe('0');
    });
  });
  //#endregion
});
