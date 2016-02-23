#include <iostream>
#include <boost/config.hpp>
#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/topological_sort.hpp>

int main(int, char**)
{
  boost::adjacency_list<> g(5);
  boost::add_edge(0,1,g);
  boost::add_edge(0,2,g);
  boost::add_edge(1,4,g);
  boost::add_edge(2,3,g);
  boost::add_edge(3,4,g);

  std::deque<int> topo;
  topological_sort(g,std::front_inserter(topo));

  for(auto it = topo.begin(); it != topo.end(); it++){
    std::cout << *it << " ";
  }
  std::cout << std::endl;

}
