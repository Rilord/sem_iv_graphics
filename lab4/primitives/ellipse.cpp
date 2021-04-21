#include "ellipse.h"

void set_vertex_ellipse(vector<vertex> &vertices, glm::vec2 center, float x, float y) {
    vertices.push_back(vertex(center.x + x, center.y + y));
    vertices.push_back(vertex(center.x + x, center.y - y));
    vertices.push_back(vertex(center.x - x, center.y + y));
    vertices.push_back(vertex(center.x - x, center.y - y));
}
void ellipse_bresenhem(vector<vertex> &vertices, glm::vec2 center, float a, float b) {
    float x = 0;
    float y = b;

    a = a * a;
    float d = roundf(b * b / 2.0f - a * b * 2 + a / 2.0f);
    b = b * b;

    set_vertex_ellipse(vertices, center, x, y);

    while(y > 0) {
        if (d <= 0) {
            float buf = 2.0f * d + 2.0f * a * y - a;
            x++;

            if (buf <= 0)
                d = d + 2.0f * b * x + b;
            else {
                y--;
                d = d + 2.0f * b * x - 2.0f * a * y + a + b;
            }
        } else {
            float buf = 2.0f * d - 2.0f * b * x - b;
            y--;

            if (buf >= 0)
                d = d - 2.0f * y * a + a;
            else {
                d = d + 2.0f * x * b - 2.0f * y * a + a + b;
                x++;
            }
        }

        set_vertex_ellipse(vertices, center, x, y);
    }
}

void ellipse_canonical(vector<vertex> &vertices, glm::vec2 center, float a, float b) {
    for (float x = 0; x <= a + 1; x++) {
        float y = roundf(b * sqrtf(1.0f - (x * x) / (a * a)));

        set_vertex_ellipse(vertices, center, x, y);
    }

    for (float y = 0; y <= b; y++) {
        float x = roundf(a * sqrt(1.0f - (y * y) / (b * b)));

        set_vertex_ellipse(vertices, center, x, y);
    }
}

void ellipse_midpoint(vector<vertex> &vertices, glm::vec2 center, float a, float b) {
    float x = 0;
    float y = b;
    
    float a2 = a * a;
    float b2 = b * b;

    float ad = 2 * a2;
    float bd = 2 * b2;

    float mid = a2 / sqrtf(a2 + b2);
    float f = b2 - a2 * b + 0.25f * a2;

    float dx = 0;
    float dy = -ad * y;

    while (x <= mid) {
        set_vertex_ellipse(vertices, center, x, y);

        if (f > 0) {
            y--;
            dy += ad;
            f += dy;
        }

        x++;
        dx += bd;
        f += dx + b2;
    }

    f += -b2 * (x + 0.75f) - a2 * (y - 0.75f);

    while (y >= 0) {
        set_vertex_ellipse(vertices, center, x, y);
        
        if (f <= 0) {
            x++;
            dx += bd;
            f  += dx;
        }

        y--;
        dy += ad;
        f += a2 + dy;
    }
}

void ellipse_parametrical(vector<vertex> &vertices, glm::vec2 center, float a, float b) {
    float m = std::max(a, b);
    float l = roundf(M_PI * m / 2.0f);

    for (float i = 0; i <= l; i++) {
        float x = a * cosf(i / m);
        float y = b * sinf(i / m);

        set_vertex_ellipse(vertices, center, x, y);
    }
}



void ellipse::render() {
    glBegin(GL_POINTS);    
    for (auto &v: vertices) {
        glColor3f(color.x, color.y, color.z);
        glVertex2f(v.x / SCREEN_WIDTH * 2, v.y / SCREEN_HEIGHT * 2);
    }
    glEnd();
}

void ellipse_spectrum::render() {
    glBegin(GL_POINTS);    
    for (auto &v: vertices) {
        glColor3f(color.x, color.y, color.z);
        glVertex2f(v.x / SCREEN_WIDTH * 2, v.y / SCREEN_HEIGHT * 2);
    }
    glEnd();
}
