#ifndef CIRCLE_
#define CIRCLE_
#include "GL/glew.h"
#include <glm/fwd.hpp>
#include <vector>

#include "glm/glm.hpp"
#define SCREEN_WIDTH 800
#define SCREEN_HEIGHT 600


using std::vector;

struct vertex {
    float x, y;
    vertex() = default;
    vertex(float _x, float _y) : x(_x), y(_y) {}
};

using circle_draw_function =  void (*)(vector<vertex> &, glm::vec2, 
        float);
using ellpise_draw_function = void (*)(vector<vertex> &, glm::vec2, 
        float, float); 

void circle_bresenhem (vector<vertex> &vertices, glm::vec2 center, float radius);
void circle_canonical (vector<vertex> &vertices, glm::vec2 center, float radius);
void circle_midpoint (vector<vertex> &vertices, glm::vec2 center, float radius);
void circle_parametrical (vector<vertex> &vertices, glm::vec2 center, float radius);

class circle {
    vector<vertex> vertices;
    glm::vec2 center;
    float radius;
    glm::vec4 color;
    circle_draw_function set_vertices;
    public:
        circle() = default;
        circle(float _radius, glm::vec4 _color, 
                glm::vec2 _center, circle_draw_function func) : center(_center), radius(_radius), color(_color), set_vertices(func) {
            set_vertices(vertices, center, radius);
        }
        void render();
        
            

        ~circle() = default;



};

class circle_spectre {
    float radius;
    float step;
    int n;
    glm::vec4 color;
    glm::vec2 center;
    vector<vertex> vertices;
    circle_draw_function set_vertices;
    
    public:
        circle_spectre() = default;
        circle_spectre(float _radius, 
                float _step, int _n, glm::vec4 _color,
                glm::vec2 _center, 
                circle_draw_function func) 
            : radius(_radius), step(_step), n(_n), color(_color), center(_center), set_vertices(func) {
            for (int i = 0; i < n; i++) {
                set_vertices(vertices, center, radius + i * step);
            }
        }
        void render();
        ~circle_spectre() = default;
    
};



#endif // CIRCLE_
