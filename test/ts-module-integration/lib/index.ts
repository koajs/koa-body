import Koa from 'koa';
import koaBody from 'koa-body';

const app = new Koa();
app.use(koaBody());

/**
 * Koa-body 4.1.2 breaking changes
 */
async function m(ctx: Koa.ParameterizedContext) {
    const { body } = ctx.request;
    console.log(JSON.stringify(body));
}

app.use(m);
