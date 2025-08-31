#include <stdio.h>
#include <stdlib.h>

int main(void) {
    FILE *fp = fopen("/root/flag.txt", "r");
    if (fp == NULL) {
        perror("Error opening /root/flag.txt");
        return 1;
    }

    char buffer[256];
    if (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("%s", buffer);
    } else {
        fprintf(stderr, "Could not read flag\n");
    }

    fclose(fp);
    return 0;
}