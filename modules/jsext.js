function callingFunction() {
    const error = new Error();
    const stack = error.stack.split('\n');
    // The caller is usually the third item in the stack trace
    const caller = stack[2].trim();
    const callerName = caller.match(/at (\w+)/)[1];
    return callerName;
}

const jsext = {
    caller: callingFunction
}

export default jsext;