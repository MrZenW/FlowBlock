var FlowBlock = require('../flowblock');
var flow = FlowBlock.create([
  (error, context, next) => {
    console.log('First flow block ran %o times', context.loopCounter);
    context.loopCounter += 1;
    next(error, context);
  },
  (error, context, next, end, pervious, first) => {
    if (context.loopCounter < 5) {
      first(error, context);
    } else {
      next(error, context);
    }
  },
]);
var initError = null;
var initContext = {
  loopCounter: 0,
};
function onFinish(error, context) {
  console.log('Flow is finished, error: %o, context: %o', error, context);
}
flow.start(initError, initContext, onFinish);
