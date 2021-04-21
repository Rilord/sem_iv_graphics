#pragma once

#include "circle.h"

using ellipse_draw_function = void (*)(vector<vertex> &, glm::vec2, 
        float, float); 

void ellipse_bresenhem (vector<vertex> &vertices, glm::vec2 center, float a, float b);
void ellipse_canonical (vector<vertex> &vertices, glm::vec2 center, float a, float b);
void ellipse_midpoint (vector<vertex> &vertices, glm::vec2 center, float a, float b);
void ellipse_parametrical (vector<vertex> &vertices, glm::vec2 center, float a, float b);

class ellipse {
    vector<vertex> vertices;
    float a, b;
    glm::vec2 center;
    glm::vec4 color; 
    ellipse_draw_function set_vertices;
    public:
        ellipse() = default;
        ellipse(float _a, float _b, glm::vec2 _center, glm::vec4 _color, ellipse_draw_function func) 
        : a(_a), b(_b), center(_center), color(_color), set_vertices(func) {
            set_vertices(vertices, center, a, b);
            
        }
        void render();
        ~ellipse() = default;
};

class ellipse_spectrum {
    vector<vertex> vertices;
    float a, b;
    glm::vec2 center;
    glm::vec4 color; 
    int n;
    float step;
    ellipse_draw_function set_vertices;
    public:
        ellipse_spectrum() = default;
        ellipse_spectrum(float _a, float _b, 
                glm::vec2 _center, glm::vec4 _color, 
                int _n, float _step,
                ellipse_draw_function func) 
        : a(_a), b(_b), center(_center), color(_color), n(_n), step(_step), set_vertices(func) {
            for (auto i = 0; i < n; i++) {
                set_vertices(vertices, center, a + i * step, b + i * step);
            }
            
        }
        ~ellipse_spectrum() = default;
        void render();
    
};

void set_vertex_ellipse(vector<vertex> &verticex, glm::vec2 center, float x, float y);
