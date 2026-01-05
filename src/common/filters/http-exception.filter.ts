import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message: any = 'Internal server error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      // normalize response shape
      if (typeof res === 'string') message = res
      else if (res && typeof res === 'object') {
        // common Nest shapes: { message, error } or { statusCode, message, error }
        if ((res as any).message) message = (res as any).message
        else message = res
      }
    } else if (exception && typeof exception === 'object') {
      try { message = (exception as any).message || JSON.stringify(exception) } catch { message = String(exception) }
    } else {
      message = String(exception)
    }

    // Log unexpected server errors
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error('Unhandled exception', exception as any)
    }

    response.status(status).json({
      statusCode: status,
      error: typeof message === 'string' ? message : message,
      path: request.url
    })
  }
}
