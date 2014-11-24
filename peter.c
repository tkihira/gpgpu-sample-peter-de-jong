#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define WIDTH 512
#define HEIGHT 512
#define WARMING 10000
#define REPETATION 5000000
#define REFLESH 5000000
#define RANDOM 1
#define random(x) ((rand() / (double)RAND_MAX + 1.0) * x)
#define RGB(r, g, b) (((int)(r) << 16) | ((int)(g) << 8) | (int)(b))

double a = -2.7;
double b = -0.09;
double c = -0.86;
double d = -2.2;

int bin[WIDTH * HEIGHT];
int bmp[WIDTH * HEIGHT];
int counter;
double x;
double y;
int cont;
double ragian;

void randomize() {
	if(RANDOM) {
		a = random(6.0) - 3.0;
		b = random(6.0) - 3.0;
		c = random(6.0) - 3.0;
		d = random(6.0) - 3.0;
	}
}
void initialize() {
	for(int i = 0; i < WIDTH * HEIGHT; i++) {
		bin[i] = 0;
		bmp[i] = 0;
	}
	randomize();
	counter = 0;
	x = 0;
	y = 0;
	if(!cont) {
		ragian = random(M_PI * 2);
	}
}
int makeColor(double ratio, double rag, int flag) {
	if(ratio > 1) {
		ratio = 1;
	}
	double c;
	if(flag) {
		c = 1 - pow(1 - ratio, 150);
		if(c == 0) {
			return RGB(0, 0, 0);
		}
		return RGB(255, 255, 255);
	}
	if(rag < 0) {
		rag += M_PI * 2.0;
	}
	if(rag >= M_PI * 2.0) {
		rag -= M_PI * 2.0;
	}
	double h1 = (int)(rag * 3.0 / M_PI);
	double s = 1;
	double f = rag / (M_PI / 3) - h1;
	double p = 1 * (1 - s);
	double q = 1 * (1 - f * s);
	double t = 1 * (1 - (1 - f) * s);
	double r, g, b;
	switch((int)(h1)) {
		case 0: r = 1; g = t; b = p; break;
		case 1: r = q; g = 1; b = p; break;
		case 2: r = p; g = 1; b = t; break;
		case 3: r = p; g = q; b = 1; break;
		case 4: r = t; g = p; b = 1; break;
		case 5: r = 1; g = p; b = 1; break;
	}
	c = 1 - pow(1 - ratio, 150);
	return RGB(pow(c, 3 - r * 1.5) * 255, pow(c, 3 - g * 1.5) * 255, pow(c, 3 - b * 1.5)* 255);
}
int show(int flag) {
	int pixels = 0;
	for(int i = 0; i < WIDTH * HEIGHT; i++) {
		double ratio = bin[i] * HEIGHT / (double)(counter - WARMING);
		int c = makeColor(ratio, ragian, flag);
		bmp[i] = c;
		if(c) {
			pixels++;
		}
	}
	if(pixels < WIDTH * HEIGHT / 200.0) {
		cont = 0;
		initialize();
		return 1;
	}
	return 0;
}
void generation () {
	for(int i = 0; i < REPETATION; i++) {
		if(counter >= REFLESH) {
			cont = 1;
			initialize();
			return;
		}
		counter++;
		double nx = sin(a * y) - cos(b * x);
		double ny = sin(c * x) - cos(d * y);
		x = nx;
		y = ny;
		if(counter >= WARMING) {
			int pos = (int)((nx / 4.0 + 0.5) * WIDTH) + (int)((ny / 4.0 + 0.5) * HEIGHT) * WIDTH;
			bin[pos]++;
			if(counter == WARMING) {
				if(show(1)) {
					return;
				}
			}
		}
	}
	if(show(0)) {
		return;
	}
}
int main(void) {

}
