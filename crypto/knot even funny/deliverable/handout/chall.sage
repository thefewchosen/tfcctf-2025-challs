from sage.all import *
from snappy import *
import re
import random
import bcrypt
import hashlib
from secret_stuff import FLAG, get_random_knot


def xor_bytes(dat, key):
    enc = []
    dat = list(dat)
    for i in range(len(dat)):
        enc.append(dat[i] ^^ key[i % len(key)])
    return bytes(enc)

def r(pd, k=1):
    output_as_tuple = bool(pd and isinstance(pd[0], tuple))
    work = [list(x) for x in pd] if pd else []
    try:
        from spherogram import Link as _SphLink
    except Exception:
        _SphLink = None
    def _relabel_starting_at_one(quads):
        labels = sorted({int(x) for quad in quads for x in quad})
        mapping = {lab: i+1 for i, lab in enumerate(labels)}
        out = []
        for quad in quads:
            out.append([mapping[int(x)] for x in quad])
        return out
    for _ in range(int(k) if k is not None else 1):
        if not work:
            work.append([1, 1, 2, 2])
            continue
        occ = {}
        for ci, quad in enumerate(work):
            if len(quad) != 4:
                raise ValueError("Invalid PD entry (must be 4-tuple): {}".format(quad))
            for pi, lab in enumerate(quad):
                occ.setdefault(int(lab), []).append((ci, pi))
        candidates = [lab for lab, where in occ.items()
                      if len(where) == 2 and where[0][0] != where[1][0]]
        max_label = max(occ.keys()) if occ else -1

        if not candidates:
            continue
        tried_any = False
        labels_pool = candidates[:]
        random.shuffle(labels_pool)
        success = False
        cur_comp = None
        if _SphLink is not None:
            try:
                cur_comp = len(_SphLink([tuple(x) for x in work]).link_components)
            except Exception:
                cur_comp = None
        while labels_pool and not success:
            L = labels_pool.pop()
            (c1, p1), (c2, p2) = occ[L]
            L1, L2, T = max_label + 1, max_label + 2, max_label + 3
            assignments = [
                ((c1, p1, L1), (c2, p2, L2)),
                ((c1, p1, L2), (c2, p2, L1)),
            ]
            patterns = [
                [L1, L2, T, T], 
                [T, T, L1, L2], 
                [L1, T, T, L2], 
                [T, L1, L2, T],
            ]

            for a1, a2 in assignments:
                for pat in patterns:
                    tried_any = True
                    # Build candidate PD
                    cand = [q[:] for q in work]
                    ci, pi, v = a1
                    cand[ci][pi] = v
                    ci, pi, v = a2
                    cand[ci][pi] = v
                    cand.append(pat[:])
                    if _SphLink is not None:
                        try:
                            testL = _SphLink([tuple(x) for x in cand])
                            if cur_comp is not None and len(testL.link_components) != cur_comp:
                                continue
                            try:
                                if len(testL.split_link_diagram()) != 1:
                                    continue
                            except Exception:
                                continue
                        except Exception:
                            continue
                    if _SphLink is not None:
                        try:
                            work = [list(q) for q in testL.PD_code(min_strand_index=1)]
                        except Exception:
                            work = _relabel_starting_at_one(cand)
                    else:
                        work = _relabel_starting_at_one(cand)
                    success = True
                    break
                if success:
                    break

        if not success:
            continue

    work = _relabel_starting_at_one(work)
    if output_as_tuple:
        return [tuple(q) for q in work]
    return work

class Challenge():
    def __init__(self):
        self.users = {}
        self.knot = get_random_knot()
        self.knot = Knot(r(self.knot.pd_code(), 123))

    def encrypt_flag(self):
        knot = self.knot
        key = knot.jones_polynomial()

        for _ in range(1024 * 1024):
            key = hashlib.sha3_512(str(key).encode()).digest()

        bruh = {
            "note": xor_bytes(FLAG.encode(), key)
        }
        print(f"Chat, we are so back rn! Check this out chat!! @grok is this real? {bruh}")

    def randomness(self):
        knot = self.knot.pd_code()
        print(f"Very random, much wow!! cromosominus would never guess this <3 {knot}... Cause he never drinks mcguava gius")

    def loop(self):
        print("Options:")
        print("1. flagus")
        print("2. what the hellyon? what the hellyante? what the hellyberry? what the helly bron james?")
        choice = input("> ")
        if choice == "1":
            self.encrypt_flag()
        elif choice == "2":
            self.randomness()
        else:
            print("Invalid option.")

if __name__ == "__main__":
    chal = Challenge()
    while True:
        chal.loop()
