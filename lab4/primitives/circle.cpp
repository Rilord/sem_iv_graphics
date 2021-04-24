#include "circle.h"
#include <iostream>
#include <cmath>

void set_vertex_circle(vector<vertex> &vertices, glm::vec2 center, float x, float y) {
    vertices.push_back(vertex( x, y));
    vertices.push_back(vertex( 2*center.x - x, y));
    vertices.push_back(vertex( x, 2*center.y - y));
    vertices.push_back(vertex( 2*center.x - x, 2*center.y - y));
    vertices.push_back(vertex( y + center.x - center.y, x + center.y - center.x));
    vertices.push_back(vertex( -y + center.x + center.y, x + center.y - center.x));
    vertices.push_back(vertex( y + center.x - center.y, -x + center.y + center.x));
    vertices.push_back(vertex( -y + center.x + center.y, -x + center.y + center.x));
}

void circle_bresenhem (vector<vertex> &vertices, glm::vec2 center, float radius) {
    float x = 0;
    float y = radius;

    float d = 2 * (1 - radius);

    while (y >= x) {
        if (d <= 0) {
            float buf = 2 * d + 2 * y - 1;
            x++;

            if (buf <= 0)
                d = d + 2 * x + 1;
            else {
                d = d + 2 * x - 2 * y + 2;
                y--;
            }
        } else {
            float buf = 2 * d - 2 * x - 1;
            y--;

            if (buf >= 0)
                d = d - 2 * y + 1;
            else {
                d = d + 2 * x - 2 * y + 2;
                x++;
            }
        }
        set_vertex_circle(vertices, center,  center.x + x, center.y + y);

    }
}

void circle_canonical(vector<vertex> &vertices, glm::vec2 center, float radius) {
    for (auto x = 0.0; x < (radius / sqrtf(2.0f)) + 1; x++) {
        float y = roundf(sqrtf(radius * radius - x * x));

        set_vertex_circle(vertices, center, x + center.x, center.y + y);
    }
}

void circle_midpoint(vector<vertex> &vertices, glm::vec2 center, float radius) {
    float x = 0;
    float y = radius;

    float d = 1.25f - radius;

    while (x <= y) {
        set_vertex_circle(vertices, center, x + center.x, y + center.y);

        x++;

        if (d < 0)
            d += 2 * x + 1;
        else {
            d += 2 * x - 2 * y + 5;
            y--;
        }
        
    }
}


void circle_parametrical (vector<vertex> &vertices, 
        glm::vec2 center, float radius) {
    float l = roundf(M_PI * radius / 2.0) / 2.0f;

    for (auto i = 0.0f; i <= l; i++) {
        auto x = radius * cosf(i / radius);
        auto y = radius * sinf(i / radius);
        set_vertex_circle(vertices, center, center.x + x, center.y + y);
    }
    
}

void circle::render() {
    glBegin(GL_POINTS);    
    for (auto &v: vertices) {
        glColor3f(color.x, color.y, color.z);
        glVertex2f(v.x / SCREEN_WIDTH * 2, v.y / SCREEN_HEIGHT * 2);
    }
    glEnd();
}

void circle_spectrum::render() {
    glBegin(GL_POINTS);    
    for (auto &v: vertices) {
        glColor3f(color.x, color.y, color.z);
        glVertex2f(v.x / SCREEN_WIDTH * 2, v.y / SCREEN_HEIGHT * 2);
    }
    glEnd();
}
