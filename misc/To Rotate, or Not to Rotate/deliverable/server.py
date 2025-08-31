import os, sys, random

POINTS = [(x, y) for x in range(3) for y in range(3)]

def gcd(a, b):
    while b:
        a, b = b, a % b
    return abs(a)

def valid_segment(a, b):
    if a == b: return False
    dx, dy = abs(a[0]-b[0]), abs(a[1]-b[1])
    return gcd(dx, dy) == 1 and 0 <= a[0] <= 2 and 0 <= a[1] <= 2 and 0 <= b[0] <= 2 and 0 <= b[1] <= 2

SEGMENTS = []
for i in range(len(POINTS)):
    for j in range(i+1, len(POINTS)):
        a, b = POINTS[i], POINTS[j]
        if valid_segment(a, b):
            A, B = sorted([a, b])
            SEGMENTS.append((A, B))
assert len(SEGMENTS) == 28
SEG_INDEX = {SEGMENTS[i]: i for i in range(28)}

def rot_point(p, k):
    x, y = p; cx, cy = 1, 1
    x0, y0 = x - cx, y - cy
    for _ in range(k % 4):
        x0, y0 = -y0, x0
    return (x0 + cx, y0 + cy)

def rot_segment(seg, k):
    a, b = seg
    ra, rb = rot_point(a, k), rot_point(b, k)
    A, B = sorted([ra, rb])
    return (A, B)

def canon_bits(segs):
    vals = []
    for k in range(4):
        bits = 0
        for (a, b) in segs:
            A, B = sorted([a, b])
            rs = rot_segment((A, B), k)
            bits |= (1 << SEG_INDEX[rs])
        vals.append(bits)
    return min(vals)

def parse_pattern(m, lines):
    segs, seen = [], set()
    if m <= 0: raise ValueError("m must be > 0")
    for ln in lines:
        x1, y1, x2, y2 = map(int, ln.split())
        a, b = (x1, y1), (x2, y2)
        if not valid_segment(a, b):
            raise ValueError("invalid segment")
        A, B = sorted([a, b])
        if (A, B) in seen: raise ValueError("duplicate segment")
        seen.add((A, B))
        segs.append((A, B))
    return segs

def mutate_pattern(segs):
    k = random.randrange(4)
    out = []
    for (a, b) in segs:
        ra, rb = rot_point(a, k), rot_point(b, k)
        if random.getrandbits(1): ra, rb = rb, ra
        out.append((ra, rb))
    random.shuffle(out)
    return out

def println(*xs):
    sys.stdout.write(" ".join(str(x) for x in xs) + "\n")
    sys.stdout.flush()

def read_int():
    s = sys.stdin.readline()
    if not s: raise EOFError
    return int(s.strip())

def read_line():
    s = sys.stdin.readline()
    if not s: raise EOFError
    return s.strip()

# --------- main protocol ----------
def main():
    random.seed(os.urandom(16))
    Q     = 120         
    MAXN  = 40000000
    FLAG  = "TFCCTF{fake_flag}"

    println("=== To rotate, or not to rotate ===")
    sys.stdout.flush()

    # Phase 1
    Ns = [random.randint(1, MAXN) for _ in range(Q)]
    canon2N = {}
    stored = []  
    for i, N in enumerate(Ns, 1):
        println(f"N_{i}:", N)
        try:
            m = read_int()
            lines = [read_line() for _ in range(m)]
            segs = parse_pattern(m, lines)
            c = canon_bits(segs)
            if c in canon2N and canon2N[c] != N:
                println("Error: duplicate pattern modulo rotation used for a different N. Bye.")
                return
            canon2N[c] = N
            stored.append((N, segs, c))
            println("OK")
        except Exception as e:
            println("Input error:", e)
            return

    println("=== Phase 2 ===")
    order = list(range(Q))
    random.shuffle(order)
    correct = 0
    for idx in order:
        N, segs, c = stored[idx]
        mut = mutate_pattern(segs)
        println("MutatedPattern:")
        println(len(mut))
        for (a, b) in mut:
            println(a[0], a[1], b[0], b[1])
        println("Your answer for N?")
        try:
            ans = read_int()
        except Exception:
            println("Bad answer. Bye.")
            return
        expected = canon2N.get(canon_bits(mut), None)
        if expected is None:
            println("Internal error: unknown pattern. Bye."); return
        if ans == expected:
            println("OK")
            correct += 1
        else:
            println("Wrong (expected", expected, ")")

    if correct == Q:
        println("All correct! Here is your flag:")
        println(FLAG)
    else:
        println(f"You solved {correct}/{Q}. No flag.")

if __name__ == "__main__":
    main()

