// 全局错误处理

import { Context } from 'koa';

export default async function globalErrorHandler(ctx: Context, next: () => Promise<void>) {
  try {
    await next();
  } catch (err) {
    console.error('Global error handler caught an error:', err);
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.message || 'Internal Server Error',
    };
  }
}
