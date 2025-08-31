import random
from secret_stuff import FLAG

class Challenge():
    def __init__(self):
        self.n = 2**26
        self.k = 2000
        # self.words = [i for i in range(n)]
        # self.buf = random.choices(self.words, k=k)
        self.index = 0

    def get_sample(self):
        self.index += 1
        if self.index > self.k:
            print("Reached end of buffer")
        else:
            print("uhhh here is something but idk what u finna do with it: ", random.choices(range(self.n), k=1)[0])

    def get_flag(self):
        idxs = [i for i in range(256)]
        key = random.choices(idxs, k=len(FLAG))
        omlet = [ord(FLAG[i]) ^ key[i] for i in range(len(FLAG))]
        print("uhh ig I can give you this if you really want it... chat?", omlet)

    def loop(self):
        while True:
            print("what you finna do, huh?")
            print("1. guava")
            print("2. muava")
            choice = input("Enter your choice: ")
            if choice == "1":
                self.get_sample()
            elif choice == "2":
                self.get_flag()
            else:
                print("Invalid choice")


if __name__ == "__main__":
    c = Challenge()
    c.loop()
