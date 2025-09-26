import { Request, Response, NextFunction } from "express";

// Validation des entrées utilisateur
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Nettoie les chaînes de caractères pour éviter les injections
  function sanitizeString(str: string): string {
    if (typeof str !== 'string') return str;

    return str
      .trim()
      .replace(/[<>]/g, '') // Enlève les balises HTML basiques
      .replace(/javascript:/gi, '') // Enlève les URLs javascript
      .replace(/on\w+=/gi, '') // Enlève les gestionnaires d'événements
      .slice(0, 1000); // Limite la taille
  }

  function sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = sanitizeString(key);
        sanitized[sanitizedKey] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}

// Validation des tailles de payload
export function validatePayloadSize(maxSize: number = 1024 * 1024) { // 1MB par défaut
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');

    if (contentLength > maxSize) {
      return res.status(413).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Payload size ${contentLength} exceeds maximum ${maxSize} bytes`
        }
      });
    }

    next();
  };
}

// Validation des paramètres d'événement
export function validateEventCode(req: Request, res: Response, next: NextFunction) {
  const eventCode = req.params.eventCode || req.params.code;

  if (!eventCode) {
    return res.status(400).json({
      error: { code: 'EVENT_CODE_REQUIRED', message: 'Event code is required' }
    });
  }

  // Validation du format du code d'événement (lettres et chiffres uniquement)
  if (!/^[A-Z0-9]{4,16}$/i.test(eventCode)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_EVENT_CODE_FORMAT',
        message: 'Event code must be 4-16 alphanumeric characters'
      }
    });
  }

  next();
}

// Validation des IDs numériques
export function validateNumericId(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];

    if (!id) {
      return res.status(400).json({
        error: { code: 'ID_REQUIRED', message: `${paramName} is required` }
      });
    }

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID_FORMAT',
          message: `${paramName} must be a numeric ID`
        }
      });
    }

    next();
  };
}

// Validation du nickname des joueurs
export function validateNickname(req: Request, res: Response, next: NextFunction) {
  const nickname = req.body?.nickname;

  if (!nickname || typeof nickname !== 'string') {
    return res.status(400).json({
      error: { code: 'NICKNAME_REQUIRED', message: 'Nickname is required' }
    });
  }

  const trimmed = nickname.trim();

  if (trimmed.length < 2) {
    return res.status(400).json({
      error: { code: 'NICKNAME_TOO_SHORT', message: 'Nickname must be at least 2 characters' }
    });
  }

  if (trimmed.length > 50) {
    return res.status(400).json({
      error: { code: 'NICKNAME_TOO_LONG', message: 'Nickname must be at most 50 characters' }
    });
  }

  // Vérifier les caractères interdits
  if (!/^[a-zA-Z0-9\s\-_\.À-ÿ]+$/.test(trimmed)) {
    return res.status(400).json({
      error: {
        code: 'NICKNAME_INVALID_CHARACTERS',
        message: 'Nickname contains invalid characters'
      }
    });
  }

  req.body.nickname = trimmed;
  next();
}

// Validation du nom d'équipe
export function validateTeamName(req: Request, res: Response, next: NextFunction) {
  const teamName = req.body?.name;

  if (!teamName || typeof teamName !== 'string') {
    return res.status(400).json({
      error: { code: 'TEAM_NAME_REQUIRED', message: 'Team name is required' }
    });
  }

  const trimmed = teamName.trim();

  if (trimmed.length < 2) {
    return res.status(400).json({
      error: { code: 'TEAM_NAME_TOO_SHORT', message: 'Team name must be at least 2 characters' }
    });
  }

  if (trimmed.length > 100) {
    return res.status(400).json({
      error: { code: 'TEAM_NAME_TOO_LONG', message: 'Team name must be at most 100 characters' }
    });
  }

  req.body.name = trimmed;
  next();
}

// Validation des réponses de blind test
export function validateAnswer(req: Request, res: Response, next: NextFunction) {
  const text = req.body?.text;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      error: { code: 'ANSWER_TEXT_REQUIRED', message: 'Answer text is required' }
    });
  }

  const trimmed = text.trim();

  if (trimmed.length < 1) {
    return res.status(400).json({
      error: { code: 'ANSWER_EMPTY', message: 'Answer cannot be empty' }
    });
  }

  if (trimmed.length > 255) {
    return res.status(400).json({
      error: { code: 'ANSWER_TOO_LONG', message: 'Answer must be at most 255 characters' }
    });
  }

  req.body.text = trimmed;
  next();
}

// Validation des adresses email
export function validateEmail(req: Request, res: Response, next: NextFunction) {
  const email = req.body?.email;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      error: { code: 'EMAIL_REQUIRED', message: 'Email is required' }
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: { code: 'INVALID_EMAIL_FORMAT', message: 'Invalid email format' }
    });
  }

  req.body.email = email.toLowerCase().trim();
  next();
}

// Validation des mots de passe
export function validatePassword(req: Request, res: Response, next: NextFunction) {
  const password = req.body?.password;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      error: { code: 'PASSWORD_REQUIRED', message: 'Password is required' }
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: { code: 'PASSWORD_TOO_SHORT', message: 'Password must be at least 8 characters' }
    });
  }

  if (password.length > 128) {
    return res.status(400).json({
      error: { code: 'PASSWORD_TOO_LONG', message: 'Password must be at most 128 characters' }
    });
  }

  // Vérifier la complexité (au moins une lettre et un chiffre)
  if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
    return res.status(400).json({
      error: {
        code: 'PASSWORD_TOO_WEAK',
        message: 'Password must contain at least one letter and one number'
      }
    });
  }

  next();
}