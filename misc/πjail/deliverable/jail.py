from concurrent import interpreters
import threading
import ctypes, pwd
import os

os.setgroups([])
os.setgid(pwd.getpwnam("nobody").pw_gid)

INPUT = None

def safe_eval(user_input):
    safe_builtins = {}

    blacklist = ['os', 'system', 'subprocess', 'compile', 'code', 'chr', 'str', 'bytes']
    if any(b in user_input for b in blacklist):
        print("Blacklisted function detected.")
        return False
    if any(ord(c) < 32 or ord(c) > 126 for c in user_input):
        print("Invalid characters detected.")
        return False

    success = True

    try:
        print("Result:", eval(user_input, {"__builtins__": safe_builtins}, {"__builtins__": safe_builtins}))
    except:
        success = False

    return success

def safe_user_input():
    global INPUT
    # drop priv level
    libc = ctypes.CDLL(None)
    syscall = libc.syscall
    nobody_uid = pwd.getpwnam("nobody").pw_uid
    SYS_setresuid = 117
    syscall(SYS_setresuid, nobody_uid, nobody_uid, nobody_uid)

    try:
        user_interpreter = interpreters.create()
        INPUT = input("Enter payload: ")
        user_interpreter.call(safe_eval, INPUT)
        user_interpreter.close()
    except:
        pass

while True:
    try:
        t = threading.Thread(target=safe_user_input)
        t.start()
        t.join()
        
        if INPUT == "exit":
            break
    except:
        print("Some error occured")
        break
