"use strict";

(function ModuleSpace(undefined) {
  function BLANK_FUNCTION() {}
  function DEFAULT_STEP_EXECUTOR(error, context, cb) { return cb(); }
  function _assertOK(value, message) {
    if (!value) throw message;
  }
  function _isFunction(v) { return typeof v === 'function'; }
  function _isFlowBlock(v) { return v instanceof FlowBlock; }
  function _objectMerge(target) {
    if (target === null || target === undefined) throw new TypeError('Cannot convert undefined or null to object');
    var to = Object(target);
    for (var i = 1; i < arguments.length; i += 1) {
      var nextSource = arguments[i];
      if (nextSource) {
        for (var nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  }
  function _arrayShallowClone(target) {
    if (!Array.isArray(target)) throw new TypeError('Cannot convert undefined or null to array');
    return [].concat(target);
  }
  function FlowBlock(steps, config_) {
    this._steps = _arrayShallowClone(steps).reduce(function(acc, step, index) { // shallow clone
      var itIsFlowBlock = _isFlowBlock(step);
      _assertOK(
        _isFunction(step) || itIsFlowBlock,
        new TypeError(`Expect every single step in the flow would be either a function or instance of FlowBlock class but found a(an) ${typeof step} in them at index [${index}].`),
      );
      itIsFlowBlock ? acc.push.apply(acc, step._steps) : acc.push(step);
      return acc;
    }, []);
    this._config = {};
    this.config(_objectMerge({
      stepExecutor: DEFAULT_STEP_EXECUTOR,
      onFinish: BLANK_FUNCTION,
      defaultContext: {},
    }, config_ || {}));
  }
  function FlowBlockPrototype() {}
  FlowBlock.prototype = FlowBlockPrototype;
  FlowBlock.create = function createFlowBlock(steps) {
    return new FlowBlock(steps);
  };
  FlowBlock.isFlowBlock = _isFlowBlock;
  FlowBlockPrototype.config = function FlowBlockConfig(config) {
    this._config = _objectMerge(this._config || {}, config);
    return this;
  };
  FlowBlockPrototype.setConfig = function FlowBlockSetConfig(config) {
    this._config = config;
    return this;
  };
  FlowBlockPrototype.start = function FlowBlockStart(initError_, initContext_, opt_, onFinish_) {
    var opt = opt_ || {};
    var onFinish = onFinish_;
    if (_isFunction(opt)) {
      onFinish = opt;
      opt = {};
    }
    opt.onFinish = opt.onFinish || onFinish;
    var $config = _objectMerge({}, this._config, opt);
    if (!_isFunction($config.onFinish)) $config.onFinish = BLANK_FUNCTION; 
    var $steps = _arrayShallowClone(this._steps); // shallow clone
    var $initContext = _objectMerge({}, initContext_ || {}, this._config.defaultContext);
    function executor(currError_, currContext, currIndex_) {
      var currIndex = currIndex_ || 0;
      function firstStep() {
        executor(arguments[0] || currError_,
          arguments.length > 1 ? arguments[1] : $initContext,
          0
        );
      }
      function previousStep() {
        executor(arguments[0] || currError_,
          arguments.length > 1 ? arguments[1] : $initContext,
          currIndex - 1
        );
      }
      function nextStep() {
        executor(arguments[0] || currError_,
          arguments.length > 1 ? arguments[1] : $initContext,
          currIndex + 1
        );
      };
      function endStep() {
        executor(arguments[0] || currError_,
          arguments.length > 1 ? arguments[1] : $initContext,
          $steps.length - 1
        );
      };
      var stepExecutor = _isFunction($config.stepExecutor) ? $config.stepExecutor : DEFAULT_STEP_EXECUTOR;
      if (currIndex >= $steps.length) {
        stepExecutor(initError_, currContext, function finalStepExecutorFunction(changedError, changedContext) {
          var onFinishFunction = _isFunction($config.onFinish) ? $config.onFinish : BLANK_FUNCTION;
          onFinishFunction(
            changedError || currError_,
            changedContext || currContext,
          );
        });
      } else {
        var step = $steps[currIndex] || BLANK_FUNCTION;
        stepExecutor(initError_, currContext, function stepExecutorFunction(changedError, changedContext) {
          step(
            changedError || currError_,
            changedContext || currContext,
            nextStep, endStep, previousStep, firstStep
          );
        }, currIndex);
      }
    }
    executor(initError_, $initContext, 0);
    return this;
  };
  if (typeof window === 'object') window.FlowBlock = FlowBlock;
  if (typeof module === 'object') module.exports = FlowBlock;
})();
