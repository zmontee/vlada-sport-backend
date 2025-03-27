export class AppError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.status = status;

    if (errors) {
      this.errors = errors;
    }
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(field: string) {
    super(409, `${field} is already taken`, { [field]: ['is already taken'] });
  }
}

export class ValidationError extends AppError {
  constructor() {
    super(400, 'Validation error');
  }
}
